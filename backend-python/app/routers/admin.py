from html import escape
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import get_db
from app.models.booking import Booking, BookingEvent

router = APIRouter(prefix="/api/v1/admin", tags=["course demo admin"])
TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"paid", "cancelled"},
    "paid": {"active"},
    "active": {"completed"},
}
LABELS = {
    "pending": "Очікує підтвердження", "confirmed": "Підтверджено",
    "paid": "Оплачено · симуляція", "active": "Автомобіль видано",
    "completed": "Оренду завершено", "cancelled": "Скасовано",
}


class TransitionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(pattern=r"^(confirmed|paid|active|completed|cancelled)$")
    note: str = Field(default="", max_length=500)


async def require_demo_admin(x_demo_admin_key: str = Header(default="", alias="X-Demo-Admin-Key")):
    if not secrets.compare_digest(x_demo_admin_key, settings.ADMIN_DEMO_KEY):
        raise HTTPException(status_code=401, detail="Невірний ключ демо-адміністратора")


def serialize(booking: Booking, events: list[BookingEvent]) -> dict:
    return {
        "id": booking.id, "status": booking.status, "statusLabel": LABELS[booking.status],
        "createdAt": booking.created_at.isoformat() if booking.created_at else None,
        "customer": {"name": booking.user.full_name, "phone": booking.user.phone, "email": booking.user.email},
        "vehicle": {"id": booking.vehicle_id, "make": booking.vehicle.make, "model": booking.vehicle.model, "img": booking.vehicle.img},
        "startAt": booking.start_at.isoformat(), "endAt": booking.end_at.isoformat(), "days": booking.days,
        "pickup": {"name": booking.pickup_location_name, "address": booking.pickup_address, "timezone": booking.pickup_timezone},
        "return": {"name": booking.return_location_name, "address": booking.return_address, "timezone": booking.return_timezone},
        "totalAmount": booking.total_amount, "depositAmount": booking.deposit_amount,
        "paymentLabel": booking.deposit_status,
        "events": [{"type": e.event_type, "from": e.from_status, "to": e.to_status, "note": e.note, "at": e.created_at.isoformat()} for e in events],
    }


async def load_booking(db: AsyncSession, booking_id: str) -> Booking:
    result = await db.execute(select(Booking).options(joinedload(Booking.user), joinedload(Booking.vehicle)).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=404, detail="Заявку не знайдено")
    return booking


@router.get("/bookings", dependencies=[Depends(require_demo_admin)])
async def list_bookings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).options(joinedload(Booking.user), joinedload(Booking.vehicle)).order_by(Booking.created_at.desc()))
    bookings = result.unique().scalars().all()
    ids = [booking.id for booking in bookings]
    events_result = await db.execute(select(BookingEvent).where(BookingEvent.booking_id.in_(ids)).order_by(BookingEvent.created_at)) if ids else None
    events_by_booking: dict[str, list[BookingEvent]] = {}
    if events_result:
        for event in events_result.scalars():
            events_by_booking.setdefault(event.booking_id, []).append(event)
    return {"items": [serialize(booking, events_by_booking.get(booking.id, [])) for booking in bookings], "simulation": True}


@router.patch("/bookings/{booking_id}/status", dependencies=[Depends(require_demo_admin)])
async def transition_booking(booking_id: str, payload: TransitionRequest, db: AsyncSession = Depends(get_db)):
    booking = await load_booking(db, booking_id)
    if payload.status not in TRANSITIONS.get(booking.status, set()):
        raise HTTPException(status_code=409, detail=f"Перехід «{LABELS[booking.status]}» → «{LABELS[payload.status]}» неможливий")
    previous = booking.status
    booking.status = payload.status
    if payload.status == "paid":
        booking.deposit_status = "Сплачено · симуляція"
    event_type = "payment_simulated" if payload.status == "paid" else "status_changed"
    default_note = "Демо-оплату позначено як успішну; платіжний провайдер не викликався" if payload.status == "paid" else f"Статус змінено: {LABELS[payload.status]}"
    db.add(BookingEvent(booking_id=booking.id, event_type=event_type, from_status=previous,
                        to_status=payload.status, note=payload.note.strip() or default_note))
    await db.commit()
    await db.refresh(booking)
    events_result = await db.execute(select(BookingEvent).where(BookingEvent.booking_id == booking.id).order_by(BookingEvent.created_at))
    return serialize(await load_booking(db, booking.id), list(events_result.scalars()))


@router.get("/bookings/{booking_id}/contract", dependencies=[Depends(require_demo_admin)])
async def demo_contract(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await load_booking(db, booking_id)
    if booking.status not in {"confirmed", "paid", "active", "completed"}:
        raise HTTPException(status_code=409, detail="Спочатку підтвердіть заявку, щоб сформувати демонстраційний договір")
    esc = lambda value: escape(str(value or "—"))
    html = f"""<!doctype html><html lang='uk'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>Демо-договір {esc(booking.id)}</title>
    <style>body{{font:16px/1.6 Arial,sans-serif;color:#202020;max-width:780px;margin:48px auto;padding:0 24px}}h1{{font-size:28px}}.notice{{padding:14px;background:#fff4d9;border:1px solid #e8c76b}}.row{{border-bottom:1px solid #ddd;padding:10px 0}}button{{padding:10px 18px}}@media print{{button{{display:none}}body{{margin:0 auto}}}}</style>
    <h1>Договір оренди автомобіля · навчальна симуляція</h1><p class='notice'><b>Демо-документ.</b> Не є юридично чинним договором і не підтверджує оплату.</p>
    <div class='row'><b>Номер заявки:</b> {esc(booking.id)}</div><div class='row'><b>Орендар:</b> {esc(booking.user.full_name)} · {esc(booking.user.phone)}</div>
    <div class='row'><b>Автомобіль:</b> {esc(booking.vehicle.make)} {esc(booking.vehicle.model)} ({esc(booking.vehicle.year)})</div>
    <div class='row'><b>Отримання:</b> {esc(booking.start_at)} · {esc(booking.pickup_location_name)}, {esc(booking.pickup_address)}</div>
    <div class='row'><b>Повернення:</b> {esc(booking.end_at)} · {esc(booking.return_location_name)}, {esc(booking.return_address)}</div>
    <div class='row'><b>Термін:</b> {booking.days} календарних діб</div><div class='row'><b>Сума:</b> {booking.total_amount:,} грн · <b>Застава:</b> {booking.deposit_amount:,} грн</div>
    <p>У демонстраційному сценарії ця сторінка показує сформований документ для перегляду та друку.</p><p>Підпис орендодавця ____________________ &nbsp; Підпис орендаря ____________________</p><button onclick='window.print()'>Друкувати / зберегти PDF</button></html>"""
    return HTMLResponse(html, headers={"Cache-Control": "no-store"})


@router.get("/bookings/{booking_id}/receipt", dependencies=[Depends(require_demo_admin)])
async def demo_receipt(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await load_booking(db, booking_id)
    if booking.status not in {"paid", "active", "completed"}:
        raise HTTPException(status_code=409, detail="Квитанція доступна після позначення демо-оплати")
    esc = lambda value: escape(str(value or "—"))
    html = f"""<!doctype html><html lang='uk'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>Демо-квитанція {esc(booking.id)}</title>
    <style>body{{font:16px/1.6 Arial,sans-serif;color:#202020;max-width:700px;margin:48px auto;padding:0 24px}}h1{{font-size:28px}}.notice{{padding:14px;background:#fff4d9;border:1px solid #e8c76b}}.row{{border-bottom:1px solid #ddd;padding:10px 0}}button{{padding:10px 18px}}@media print{{button{{display:none}}body{{margin:0 auto}}}}</style>
    <h1>Підтвердження оплати · навчальна симуляція</h1><p class='notice'><b>Демо-квитанція.</b> Банківський платіж не виконувався; цей документ не є фіскальним чеком.</p>
    <div class='row'><b>Заявка:</b> {esc(booking.id)}</div><div class='row'><b>Клієнт:</b> {esc(booking.user.full_name)}</div>
    <div class='row'><b>Автомобіль:</b> {esc(booking.vehicle.make)} {esc(booking.vehicle.model)}</div>
    <div class='row'><b>Сума оренди:</b> {booking.total_amount:,} грн</div><div class='row'><b>Застава:</b> {booking.deposit_amount:,} грн</div>
    <div class='row'><b>Статус:</b> Оплачено · симуляція</div><p>Квитанцію створено для демонстрації кроку оплати у навчальному сценарії.</p>
    <button onclick='window.print()'>Друкувати / зберегти PDF</button></html>"""
    return HTMLResponse(html, headers={"Cache-Control": "no-store"})
