from typing import List, Dict
from pydantic import BaseModel

class DayInfo(BaseModel):
    date: str
    day: str
    weekday: str
    isToday: bool = False

class AvailabilityResponse(BaseModel):
    days: List[DayInfo]
    schedules: Dict[str, List[int]]  # car_id -> [1, 1, 0, ...]
