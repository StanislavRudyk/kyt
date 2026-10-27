from typing import List, Optional, Literal
from datetime import date
from pydantic import BaseModel, Field, field_validator

class VehicleResponse(BaseModel):
    id: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$", description="Стабільний ідентифікатор авто для URL і бронювання")
    year: int = Field(ge=1886, le=2100)
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=100)
    trim: Optional[str] = Field(default=None, max_length=100, description="Комплектація або позначення силової установки з каталогу")
    category: Literal["Спорт", "Позашляховик", "Електро", "Гібрид", "Пікап"] = Field(description="Єдина категорія каталогу")
    bodyType: Optional[str] = Field(default=None, max_length=50, description="Тип кузова; null, якщо джерело не надало підтверджених даних")
    fuel: str = Field(min_length=1, max_length=50)
    pricePerDay: int = Field(ge=0, le=2_000_000_000, description="Ціна у гривнях за добу")
    pricePerWeek: int = Field(ge=0, le=2_000_000_000, description="Ціна у гривнях за тиждень")
    pricePerMonth: int = Field(ge=0, le=2_000_000_000, description="Ціна у гривнях за місяць")
    hp: int = Field(ge=0, le=100_000)
    zeroHundred: float = Field(ge=0, le=1000)
    topSpeed: int = Field(ge=0, le=100_000)
    drive: str
    color: str
    location: str
    img: str = Field(pattern=r"^[a-zA-Z0-9_-]+$")
    gallery: List[str] = Field(default_factory=list, max_length=30, description="Імена локальних фотографій без розширення")
    available: bool = Field(description="Прапорець публікації/операційної доступності; не замінює перевірку дат")
    availableFrom: Optional[str] = Field(default=None, description="Дата, з якої авто може бути доступне, у форматі YYYY-MM-DD")
    deposit: int = Field(ge=0, le=2_000_000_000)
    minAge: int = Field(ge=18, le=100)
    transmission: str
    seats: int = Field(ge=1, le=20)
    trunk: int = Field(ge=0, description="Об'єм багажника у літрах")
    km: int = Field(ge=0, description="Пробіг у кілометрах")

    @field_validator("gallery")
    @classmethod
    def validate_gallery_names(cls, values: List[str]) -> List[str]:
        if any(not value or len(value) > 100 or not all(c.isalnum() or c in "_-" for c in value) for value in values):
            raise ValueError("Імена зображень можуть містити лише літери, цифри, дефіс і підкреслення")
        return values

    @field_validator("availableFrom")
    @classmethod
    def validate_available_from(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            try:
                date.fromisoformat(value)
            except ValueError as exc:
                raise ValueError("Дата доступності має бути у форматі YYYY-MM-DD") from exc
        return value

    class Config:
        from_attributes = True
