from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


class RentalLocation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    name: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=250)
    city: str = Field(min_length=1, max_length=100)
    timeZone: str = Field(min_length=1, max_length=80)
    vehicleIds: list[str] = Field(min_length=1, max_length=200)
    openingTime: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    closingTime: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    weekdays: list[int] = Field(min_length=1, max_length=7)
    active: bool = True

    @field_validator("timeZone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Вкажіть чинний IANA часовий пояс для пункту") from exc
        return value

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(cls, value: list[int]) -> list[int]:
        if any(day < 0 or day > 6 for day in value) or len(set(value)) != len(value):
            raise ValueError("Дні роботи мають бути унікальними значеннями від 0 до 6")
        return value

    @field_validator("vehicleIds")
    @classmethod
    def validate_vehicle_ids(cls, value: list[str]) -> list[str]:
        normalized = [vehicle_id.strip() for vehicle_id in value]
        if any(not vehicle_id or len(vehicle_id) > 50 or any(not (c.isalnum() or c in "_-") for c in vehicle_id) for vehicle_id in normalized) or len(set(normalized)) != len(normalized):
            raise ValueError("ID автомобілів мають бути непорожніми та унікальними")
        return normalized

    @model_validator(mode="after")
    def validate_opening_hours(self):
        if self.openingTime >= self.closingTime:
            raise ValueError("Для пункту вказано некоректний інтервал роботи")
        return self
