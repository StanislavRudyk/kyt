from fastapi import HTTPException
from pydantic import ValidationError

from app.config import COURSE_DEMO_LOCATIONS, settings
from app.schemas.location import RentalLocation


def get_configured_locations() -> list[RentalLocation]:
    try:
        configured = settings.RENTAL_LOCATIONS or COURSE_DEMO_LOCATIONS
        locations = [RentalLocation.model_validate(item) for item in configured]
    except (ValidationError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="Конфігурація пунктів видачі некоректна") from exc
    ids = [location.id for location in locations]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=503, detail="ID пунктів видачі мають бути унікальними")
    return [location for location in locations if location.active]
