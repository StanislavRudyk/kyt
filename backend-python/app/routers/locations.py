from fastapi import APIRouter
from app.services.locations import get_configured_locations
from app.schemas.location import RentalLocation

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


@router.get("", response_model=list[RentalLocation])
async def list_locations():
    return get_configured_locations()
