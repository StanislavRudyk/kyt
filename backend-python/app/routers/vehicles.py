from typing import Optional, Literal
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleResponse
from app.config import settings

router = APIRouter(prefix="/api/v1/vehicles", tags=["vehicles"])

def vehicle_to_dict(v: Vehicle) -> dict:
    return {
        "id": v.id,
        "year": v.year,
        "make": v.make,
        "model": v.model,
        "trim": v.trim,
        "category": v.category,
        "bodyType": v.body_type,
        "fuel": v.fuel,
        "pricePerDay": v.price_per_day,
        "pricePerWeek": v.price_per_week,
        "pricePerMonth": v.price_per_month,
        "hp": v.hp,
        "zeroHundred": v.zero_hundred,
        "topSpeed": v.top_speed,
        "drive": v.drive,
        "color": v.color,
        "location": v.location,
        "img": v.img,
        "gallery": v.gallery or [],
        "available": v.available,
        "availableFrom": v.available_from,
        "deposit": v.deposit,
        "minAge": v.min_age,
        "transmission": v.transmission,
        "seats": v.seats,
        "trunk": v.trunk,
        "km": v.km,
    }

@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    category: Optional[Literal["Спорт", "Позашляховик", "Електро", "Гібрид", "Пікап", "Усі"]] = Query(None),
    body: Optional[Literal["Спорт", "Позашляховик", "Електро", "Гібрид", "Пікап", "Усі"]] = Query(None, deprecated=True),
    body_type: Optional[str] = Query(None, min_length=1, max_length=50),
    make: Optional[str] = Query(None, min_length=1, max_length=50),
    location: Optional[str] = Query(None, min_length=1, max_length=100, description="Місто"),
    fuel: Optional[str] = Query(None, min_length=1, max_length=50),
    transmission: Optional[str] = Query(None, min_length=1, max_length=50),
    seats: Optional[int] = Query(None, ge=1, le=20),
    min_price: Optional[int] = Query(None, ge=0, le=2_000_000_000),
    max_price: Optional[int] = Query(None, ge=0, le=2_000_000_000),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    available_only: bool = Query(False, description="Тільки доступні зараз"),
    sort: Literal["make_asc", "price_asc", "price_desc", "year_desc"] = Query("make_asc"),
    db: AsyncSession = Depends(get_db)
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=422, detail="Мінімальна ціна не може бути більшою за максимальну")
    stmt = select(Vehicle)
    selected_category = category or body
    if selected_category and selected_category != "Усі":
        stmt = stmt.where(Vehicle.category == selected_category)
    if body_type:
        stmt = stmt.where(Vehicle.body_type == body_type)
    if make:
        stmt = stmt.where(Vehicle.make == make)
    if location and location != "Усі":
        stmt = stmt.where(Vehicle.location == location)
    if fuel:
        stmt = stmt.where(Vehicle.fuel == fuel)
    if transmission:
        stmt = stmt.where(Vehicle.transmission == transmission)
    if seats is not None:
        stmt = stmt.where(Vehicle.seats == seats)
    if min_price is not None:
        stmt = stmt.where(Vehicle.price_per_day >= min_price)
    if max_price is not None:
        stmt = stmt.where(Vehicle.price_per_day <= max_price)
    if search:
        escaped = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        if not escaped:
            raise HTTPException(status_code=422, detail="Пошуковий запит не може бути порожнім")
        term = f"%{escaped}%"
        stmt = stmt.where(or_(Vehicle.make.ilike(term, escape="\\"), Vehicle.model.ilike(term, escape="\\"), Vehicle.trim.ilike(term, escape="\\")))
    if available_only:
        # Compare availability against the business timezone, not the host/container
        # timezone (which may be UTC even when the rental operation is not).
        business_today = datetime.now(ZoneInfo(settings.RENTAL_DEFAULT_TIME_ZONE)).date().isoformat()
        stmt = stmt.where(or_(Vehicle.available.is_(True), Vehicle.available_from <= business_today))

    if sort == "price_asc":
        stmt = stmt.order_by(Vehicle.price_per_day.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Vehicle.price_per_day.desc())
    elif sort == "year_desc":
        stmt = stmt.order_by(Vehicle.year.desc(), Vehicle.make.asc(), Vehicle.model.asc())
    else:
        stmt = stmt.order_by(Vehicle.make.asc(), Vehicle.model.asc())

    result = await db.execute(stmt)
    vehicles = result.scalars().all()
    return [vehicle_to_dict(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str = Path(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$"), db: AsyncSession = Depends(get_db)):
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(stmt)
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Автомобіль не знайдено")
    return vehicle_to_dict(vehicle)
