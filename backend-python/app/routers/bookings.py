import uuid
import hashlib
import json
from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.booking import Booking, BookingEvent, User
from app.models.vehicle import Vehicle
from app.schemas.booking import BookingCreateRequest, BookingResponse, RentalPeriodRequest, RentalQuoteResponse
from app.services.rental import calculate_rental_amount, get_location, local_to_utc, validate_rental_period

router = APIRouter(prefix="/api/v1/bookings", tags=["bookings"])
PRICING_NOTE = (
    "Попередній розрахунок: денний тариф × календарні дні (мінімум 1). "
    "Правила неповних діб, знижки, податки, страхування та додаткові послуги компанією не налаштовані; "
    "остаточну суму має підтвердити оператор."
)


def booking_response(booking: Booking) -> dict:
    daily_rate = booking.daily_rate_snapshot
    return {
        "id": booking.id, "vehicleId": booking.vehicle_id,
        "pickupLocationId": booking.pickup_location_id,
        "pickupLocationName": booking.pickup_location_name,
        "pickupAddress": booking.pickup_address, "pickupTimeZone": booking.pickup_timezone,
        "returnLocationId": booking.return_location_id,
        "returnLocationName": booking.return_location_name,
        "returnAddress": booking.return_address, "returnTimeZone": booking.return_timezone,
        "startDate": booking.start_date, "startTime": booking.pickup_time,
        "endDate": booking.end_date, "endTime": booking.return_time,
        "startAtUtc": booking.start_at.isoformat().replace("+00:00", "Z"),
        "endAtUtc": booking.end_at.isoformat().replace("+00:00", "Z"),
        "calendarDays": booking.days, "currency": "UAH",
        "priceLines": [{"code": "rental", "label": f"Оренда автомобіля · {booking.days} календарних діб",
                        "quantity": booking.days, "unitAmount": daily_rate, "amount": booking.base_amount}],
        "subtotalAmount": booking.base_amount, "taxAmount": None, "totalAmount": booking.total_amount,
        "depositAmount": booking.deposit_amount, "pricingNote": PRICING_NOTE,
        "status": booking.status, "privacyNoticeAccepted": booking.privacy_notice_accepted,
        "contractPdfUrl": None,
    }


async def make_quote(req: RentalPeriodRequest, db: AsyncSession) -> tuple[dict, Vehicle, object, object, datetime, datetime]:
    pickup = get_location(req.pickupLocationId)
    return_location = get_location(req.returnLocationId)
    vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == req.vehicleId))
    vehicle = vehicle_result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Автомобіль не знайдено")
    if vehicle.id not in pickup.vehicleIds or vehicle.id not in return_location.vehicleIds:
        raise HTTPException(status_code=422, detail="Обрані пункти не обслуговують цей автомобіль")
    try:
        start_time = time.fromisoformat(req.startTime)
        end_time = time.fromisoformat(req.endTime)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Вкажіть час у форматі ГГ:ХХ") from exc
    start_at = local_to_utc(req.startDate, start_time, pickup)
    end_at = local_to_utc(req.endDate, end_time, return_location)
    if end_at <= start_at:
        raise HTTPException(status_code=400, detail="Повернення має бути пізніше отримання автомобіля")
    await validate_rental_period(db, vehicle, start_at, end_at, req.startDate, req.endDate)

    calendar_days = max(1, (req.endDate - req.startDate).days)
    total = calculate_rental_amount(vehicle, calendar_days)
    quote = {
        "vehicleId": vehicle.id,
        "pickupLocationId": pickup.id, "pickupLocationName": pickup.name,
        "pickupAddress": pickup.address, "pickupTimeZone": pickup.timeZone,
        "returnLocationId": return_location.id, "returnLocationName": return_location.name,
        "returnAddress": return_location.address, "returnTimeZone": return_location.timeZone,
        "startDate": req.startDate, "startTime": req.startTime,
        "endDate": req.endDate, "endTime": req.endTime,
        "startAtUtc": start_at.isoformat().replace("+00:00", "Z"),
        "endAtUtc": end_at.isoformat().replace("+00:00", "Z"),
        "calendarDays": calendar_days, "currency": "UAH",
        "priceLines": [{
            "code": "rental", "label": f"Оренда {vehicle.make} {vehicle.model} · {calendar_days} календарних діб",
            "quantity": calendar_days, "unitAmount": vehicle.price_per_day, "amount": total,
        }],
        "subtotalAmount": total, "taxAmount": None, "totalAmount": total,
        "depositAmount": vehicle.deposit, "status": "estimate", "pricingNote": PRICING_NOTE,
    }
    return quote, vehicle, pickup, return_location, start_at, end_at


@router.post("/quote", response_model=RentalQuoteResponse)
async def quote_booking(req: RentalPeriodRequest, db: AsyncSession = Depends(get_db)):
    quote, *_ = await make_quote(req, db)
    return quote


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    req: BookingCreateRequest,
    response: Response,
    idempotency_key: str = Header(min_length=16, max_length=100, pattern=r"^[A-Za-z0-9._:-]+$", alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
):
    request_hash = hashlib.sha256(json.dumps(req.model_dump(mode="json"), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    existing_result = await db.execute(
        select(Booking).options(joinedload(Booking.vehicle)).where(Booking.idempotency_key == idempotency_key)
    )
    existing = existing_result.scalar_one_or_none()
    if existing is not None:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Ключ повторної відправки вже використано для інших даних. Почніть нову заявку.")
        response.status_code = 200
        return booking_response(existing)

    quote, vehicle, pickup, return_location, start_at, end_at = await make_quote(req, db)

    # Serialize attempts for this vehicle before checking overlap; the exclusion
    # constraint is the final protection if another writer bypasses this route.
    await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:vehicle_id))"), {"vehicle_id": vehicle.id})
    await validate_rental_period(db, vehicle, start_at, end_at, req.startDate, req.endDate)

    # Serialize customer creation by phone/email to avoid duplicate-customer races
    # across otherwise unrelated vehicle bookings.
    await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:customer_key))"), {"customer_key": f"phone:{req.phone}"})
    if req.email:
        await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:customer_key))"), {"customer_key": f"email:{req.email.lower()}"})
    user_result = await db.execute(select(User).where(User.phone == req.phone))
    user = user_result.scalar_one_or_none()
    if req.email:
        email_result = await db.execute(select(User).where(func.lower(User.email) == req.email.lower()))
        email_user = email_result.scalar_one_or_none()
        if email_user is not None and email_user.phone != req.phone:
            raise HTTPException(status_code=409, detail="Цей email уже пов’язаний з іншим номером телефону")
    if user is None:
        user = User(full_name=req.fullName, phone=req.phone, email=req.email)
        db.add(user)
        await db.flush()
    elif req.email and not user.email:
        user.email = req.email

    booking_id = f"RC-{uuid.uuid4().hex[:12].upper()}"
    booking = Booking(
        id=booking_id, idempotency_key=idempotency_key, request_hash=request_hash,
        user_id=user.id, vehicle_id=vehicle.id,
        start_date=req.startDate, end_date=req.endDate,
        pickup_time=req.startTime, return_time=req.endTime,
        start_at=start_at, end_at=end_at,
        pickup_location_id=pickup.id, pickup_location_name=pickup.name,
        pickup_address=pickup.address, pickup_timezone=pickup.timeZone,
        return_location_id=return_location.id, return_location_name=return_location.name,
        return_address=return_location.address, return_timezone=return_location.timeZone,
        privacy_notice_accepted=req.privacyNoticeAccepted,
        days=quote["calendarDays"], status="pending",
        base_amount=quote["subtotalAmount"], discount_amount=0,
        daily_rate_snapshot=vehicle.price_per_day,
        insurance_amount=0, total_amount=quote["totalAmount"],
        deposit_amount=quote["depositAmount"], deposit_status="Не сплачено",
        location=pickup.city, extras=[],
    )
    db.add(booking)
    db.add(BookingEvent(booking_id=booking.id, event_type="booking_created", from_status=None,
                        to_status="pending", note="Клієнт надіслав заявку через сайт"))
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        repeated_result = await db.execute(
            select(Booking).options(joinedload(Booking.vehicle)).where(Booking.idempotency_key == idempotency_key)
        )
        repeated = repeated_result.scalar_one_or_none()
        if repeated is not None and repeated.request_hash == request_hash:
            response.status_code = 200
            return booking_response(repeated)
        raise HTTPException(status_code=409, detail="Автомобіль щойно забронювали на цей період. Перевірте інші дати.") from exc

    await db.refresh(booking, attribute_names=["vehicle"])
    return booking_response(booking)
