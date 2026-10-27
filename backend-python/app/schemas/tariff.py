from pydantic import BaseModel, ConfigDict, Field


class TariffCalculationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    vehicleId: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    days: int = Field(ge=1, le=90)


class TariffCalculationResponse(BaseModel):
    vehicleId: str
    dailyRate: int
    days: int
    baseTotal: int
    discountPercent: int = 0
    discountAmount: int = 0
    discountedTotal: int
    insuranceCost: int = 0
    totalCost: int
    effectiveDaily: int
    pricingNote: str
