from datetime import date, datetime, time, timedelta, timezone
from typing import Dict, List
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.models.schedule import VehicleSchedule
from app.schemas.availability import AvailabilityResponse, DayInfo

router = APIRouter(prefix="/api/v1/availability", tags=["availability"])

UKR_WEEKDAYS = {
    0: "Пн", 1: "Вт", 2: "Ср", 3: "Чт", 4: "Пт", 5: "Сб", 6: "Нд"
}

@router.get("", response_model=AvailabilityResponse)
async def get_availability(db: AsyncSession = Depends(get_db)):
    local_zone = ZoneInfo(settings.RENTAL_DEFAULT_TIME_ZONE)
    today = datetime.now(local_zone).date()
    days_info: List[DayInfo] = []
    days_list: List[date] = []

    for i in range(14):
        d = today + timedelta(days=i)
        days_list.append(d)
        days_info.append(DayInfo(
            date=d.isoformat(),
            day=f"{d.day:02d}",
            weekday=UKR_WEEKDAYS[d.weekday()],
            isToday=(i == 0)
        ))

    # Отримуємо всі авто
    res_veh = await db.execute(select(Vehicle.id, Vehicle.available, Vehicle.available_from))
    vehicles = res_veh.all()

    # Отримуємо заброньовані дати на цей проміжок
    res_sch = await db.execute(
        select(VehicleSchedule.vehicle_id, VehicleSchedule.date)
        .where(VehicleSchedule.date >= today, VehicleSchedule.date <= days_list[-1])
    )
    busy_slots = {(row[0], row[1]) for row in res_sch.all()}

    res_bookings = await db.execute(
        select(Booking.vehicle_id, Booking.start_at, Booking.end_at)
        .where(Booking.status.in_(["pending", "confirmed", "paid", "active"]))
        .where(Booking.start_at < datetime.combine(days_list[-1] + timedelta(days=1), time.min, local_zone).astimezone(timezone.utc))
        .where(Booking.end_at > datetime.combine(today, time.min, local_zone).astimezone(timezone.utc))
    )
    booking_periods = res_bookings.all()

    # Формуємо розклад: 1 = вільне, 0 = зайняте
    schedules: Dict[str, List[int]] = {}
    for vid, is_published_available, available_from in vehicles:
        sched = []
        for d in days_list:
            release_date = date.fromisoformat(available_from) if available_from else None
            not_released = not is_published_available and (release_date is None or d < release_date)
            day_start = datetime.combine(d, time.min, local_zone).astimezone(timezone.utc)
            day_end = datetime.combine(d + timedelta(days=1), time.min, local_zone).astimezone(timezone.utc)
            has_booking = any(vehicle_id == vid and start_at < day_end and end_at > day_start
                              for vehicle_id, start_at, end_at in booking_periods)
            is_free = 1 if (vid, d) not in busy_slots and not has_booking and not not_released else 0
            sched.append(is_free)
        schedules[vid] = sched

    return AvailabilityResponse(days=days_info, schedules=schedules)
