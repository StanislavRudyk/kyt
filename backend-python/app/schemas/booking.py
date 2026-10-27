from datetime import date
import re
from typing import List, Optional, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RentalPeriodRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    vehicleId: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    pickupLocationId: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    returnLocationId: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    startDate: date
    startTime: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    endDate: date
    endTime: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")

    @model_validator(mode="after")
    def validate_local_order(self):
        if (self.endDate, self.endTime) <= (self.startDate, self.startTime):
            raise ValueError("Повернення має бути пізніше отримання автомобіля")
        return self


class BookingCreateRequest(RentalPeriodRequest):
    privacyNoticeAccepted: Literal[True]
    fullName: str = Field(min_length=1, max_length=100, pattern=r"^[^\x00-\x1f\x7f]+$")
    phone: str = Field(pattern=r"^\+?[0-9 ()-]{7,30}$")
    email: Optional[str] = Field(default=None, max_length=100)

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Вкажіть ім’я щонайменше з двох символів")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if sum(character.isdigit() for character in value) < 7:
            raise ValueError("Вкажіть коректний номер телефону")
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            value = value.strip()
            if value and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                raise ValueError("Вкажіть коректний email")
        return value or None


class PriceLine(BaseModel):
    code: str
    label: str
    quantity: int
    unitAmount: int
    amount: int


class RentalQuoteResponse(BaseModel):
    vehicleId: str
    pickupLocationId: str
    pickupLocationName: str
    pickupAddress: str
    pickupTimeZone: str
    returnLocationId: str
    returnLocationName: str
    returnAddress: str
    returnTimeZone: str
    startDate: date
    startTime: str
    endDate: date
    endTime: str
    startAtUtc: str
    endAtUtc: str
    calendarDays: int
    currency: str = "UAH"
    priceLines: List[PriceLine]
    subtotalAmount: int
    taxAmount: Optional[int] = None
    totalAmount: int
    depositAmount: int
    status: str = "estimate"
    pricingNote: str


class BookingResponse(RentalQuoteResponse):
    id: str
    status: str
    privacyNoticeAccepted: bool
    contractPdfUrl: Optional[str] = None
