from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking
from app.models.schedule import VehicleSchedule
from app.models.vehicle import Vehicle
from app.services.locations import get_configured_locations
from app.schemas.location import RentalLocation


def get_location(location_id: str) -> RentalLocation:
    location = next((item for item in get_configured_locations() if item.id == location_id), None)
    if location is None:
        raise HTTPException(status_code=422, detail="Оберіть чинний пункт видачі або повернення зі списку")
    return location


def local_to_utc(local_date: date, local_time: time, location: RentalLocation) -> datetime:
    local_value = datetime.combine(local_date, local_time)
    zone = ZoneInfo(location.timeZone)
    candidates = []
    for fold in (0, 1):
        candidate = local_value.replace(tzinfo=zone, fold=fold)
        round_trip = candidate.astimezone(timezone.utc).astimezone(zone).replace(tzinfo=None)
        if round_trip == local_value and all(candidate.utcoffset() != existing.utcoffset() for existing in candidates):
            candidates.append(candidate)
    if not candidates:
        raise HTTPException(status_code=422, detail=f"Час не існує у часовому поясі {location.timeZone} через перехід годинника")
    if len(candidates) > 1:
        raise HTTPException(status_code=422, detail=f"Час неоднозначний у часовому поясі {location.timeZone}; оберіть інший час")
    if local_time.strftime("%H:%M") < location.openingTime or local_time.strftime("%H:%M") > location.closingTime:
        raise HTTPException(status_code=422, detail=f"Час має бути в межах роботи пункту: {location.openingTime}–{location.closingTime}")
    if local_date.weekday() not in location.weekdays:
        raise HTTPException(status_code=422, detail="Обраний пункт не працює цього дня тижня")
    return candidates[0].astimezone(timezone.utc)


async def validate_rental_period(db: AsyncSession, vehicle: Vehicle, start_at: datetime, end_at: datetime,
                                 start_date: date, end_date: date) -> None:
    if start_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Початок оренди має бути в майбутньому")
    if end_at <= start_at:
        raise HTTPException(status_code=400, detail="Повернення має бути пізніше отримання автомобіля")
    if (end_at - start_at).total_seconds() > 90 * 86400:
        raise HTTPException(status_code=400, detail="Максимальна тривалість заявки — 90 діб")
    if not vehicle.available and (not vehicle.available_from or start_date < date.fromisoformat(vehicle.available_from)):
        raise HTTPException(status_code=409, detail="Автомобіль недоступний на обраний період")

    overlapping = await db.execute(
        select(Booking.id).where(
            Booking.vehicle_id == vehicle.id,
            Booking.status.in_(["pending", "confirmed", "paid", "active"]),
            Booking.start_at < end_at,
            Booking.end_at > start_at,
        ).limit(1)
    )
    if overlapping.first():
        raise HTTPException(status_code=409, detail="Автомобіль уже зайнятий на частину цього періоду")

    # Maintenance/manual schedule blocks are whole local calendar days.
    schedule = await db.execute(
        select(VehicleSchedule.date).where(
            VehicleSchedule.vehicle_id == vehicle.id,
            VehicleSchedule.date >= start_date,
            VehicleSchedule.date <= end_date,
        ).limit(1)
    )
    if schedule.first():
        raise HTTPException(status_code=409, detail="На частину періоду встановлено блокування доступності")


def calculate_rental_amount(vehicle: Vehicle, calendar_days: int) -> int:
    """Base estimate only. Unconfigured business charges and discounts are never inferred."""
    if vehicle.price_per_day < 0 or vehicle.price_per_day > 2_147_483_647:
        raise HTTPException(status_code=422, detail="У тарифі автомобіля вказано некоректну суму")
    amount = vehicle.price_per_day * max(1, calendar_days)
    if amount > 2_147_483_647:
        raise HTTPException(status_code=422, detail="Сума розрахунку перевищує підтримуване значення")
    return amount
