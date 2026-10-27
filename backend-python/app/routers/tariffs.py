from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.tariff import TariffCalculationRequest, TariffCalculationResponse
from app.services.rental import calculate_rental_amount

router = APIRouter(prefix="/api/v1/tariffs", tags=["tariffs"])


@router.post("/calculate", response_model=TariffCalculationResponse)
async def calculate_rental(req: TariffCalculationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.id == req.vehicleId))
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Автомобіль не знайдено")
    base_total = calculate_rental_amount(vehicle, req.days)
    return TariffCalculationResponse(
        vehicleId=vehicle.id,
        dailyRate=vehicle.price_per_day,
        days=req.days,
        baseTotal=base_total,
        discountPercent=0,
        discountAmount=0,
        discountedTotal=base_total,
        insuranceCost=0,
        totalCost=base_total,
        effectiveDaily=vehicle.price_per_day,
        pricingNote=("Попередній розрахунок за тарифом з каталогу. Правила неповних діб, знижки, "
                     "страхування, додаткові послуги та податки ще не налаштовані."),
    )
