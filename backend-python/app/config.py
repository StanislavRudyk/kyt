from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from urllib.parse import urlsplit

COURSE_DEMO_LOCATIONS = [
    {"id": "demo-kyiv", "name": "Навчальний пункт · Київ", "address": "Демонстраційна адреса, вул. Хрещатик, 1", "city": "Київ", "timeZone": "Europe/Kyiv", "vehicleIds": ["huracan-evo", "model-s-plaid", "911-carrera-s", "range-rover-sport", "amg-gt", "f150-raptor", "rx-450h", "m4-competition", "etron-gt"], "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6]},
    {"id": "demo-odesa", "name": "Навчальний пункт · Одеса", "address": "Демонстраційна адреса, вул. Дерибасівська, 1", "city": "Одеса", "timeZone": "Europe/Kyiv", "vehicleIds": ["911-carrera-s", "rx-450h"], "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6]},
    {"id": "demo-lviv", "name": "Навчальний пункт · Львів", "address": "Демонстраційна адреса, пл. Ринок, 1", "city": "Львів", "timeZone": "Europe/Kyiv", "vehicleIds": ["range-rover-sport"], "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6]},
    {"id": "demo-kharkiv", "name": "Навчальний пункт · Харків", "address": "Демонстраційна адреса, майдан Свободи, 1", "city": "Харків", "timeZone": "Europe/Kyiv", "vehicleIds": ["f150-raptor"], "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6]},
    {"id": "demo-dnipro", "name": "Навчальний пункт · Дніпро", "address": "Демонстраційна адреса, просп. Дмитра Яворницького, 1", "city": "Дніпро", "timeZone": "Europe/Kyiv", "vehicleIds": ["m4-competition"], "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6]},
]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)
    PROJECT_NAME: str = "RentCar UA Core API"
    VERSION: str = "1.0.0"
    
    # Database credentials are private service settings and have no source-code defaults.
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = Field(default=5432, ge=1, le=65535)
    POSTGRES_DB: str = Field(min_length=1, max_length=63)
    POSTGRES_USER: str = Field(min_length=1, max_length=63)
    POSTGRES_PASSWORD: str = Field(min_length=16, repr=False)
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # PHP мікросервіс документів
    PHP_SERVICE_URL: str = "http://php-service:80"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:8080"]
    RENTAL_LOCATIONS: list[dict] = []
    ADMIN_DEMO_KEY: str = Field(default="rentcar-demo-admin-course-key", min_length=16, repr=False)
    RENTAL_DEFAULT_TIME_ZONE: str = "Europe/Kyiv"
    
    @field_validator("RENTAL_DEFAULT_TIME_ZONE")
    @classmethod
    def validate_rental_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("RENTAL_DEFAULT_TIME_ZONE має бути чинним IANA timezone") from exc
        return value

    @field_validator("POSTGRES_PASSWORD")
    @classmethod
    def reject_placeholder_password(cls, value: str) -> str:
        if value.strip().lower() in {"replace-with-a-long-random-password", "password", "changeme", "secret"}:
            raise ValueError("Задайте унікальний пароль PostgreSQL замість шаблонного значення")
        return value

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def validate_origins(cls, values: list[str]) -> list[str]:
        if len(values) != len(set(values)):
            raise ValueError("ALLOWED_ORIGINS не має містити дублікати")
        for value in values:
            parsed = urlsplit(value)
            local_http = parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
            if (parsed.scheme != "https" and not local_http) or not parsed.netloc or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment or "*" in value:
                raise ValueError("ALLOWED_ORIGINS має містити точні HTTPS origins (HTTP дозволений лише для localhost)")
        return values

settings = Settings()
