from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.schemas.location import RentalLocation
from app.services.rental import calculate_rental_amount, local_to_utc, validate_rental_period


def test_server_price_is_daily_rate_times_calendar_days():
    vehicle = SimpleNamespace(price_per_day=12_500)
    assert calculate_rental_amount(vehicle, 3) == 37_500
    assert calculate_rental_amount(vehicle, 0) == 12_500  # documented one-day minimum


@pytest.mark.parametrize("rate", [-1, 2_147_483_648])
def test_server_rejects_invalid_rates(rate):
    with pytest.raises(HTTPException) as exc:
        calculate_rental_amount(SimpleNamespace(price_per_day=rate), 1)
    assert exc.value.status_code == 422


def test_server_rejects_amount_overflow():
    with pytest.raises(HTTPException) as exc:
        calculate_rental_amount(SimpleNamespace(price_per_day=2_000_000_000), 2)
    assert exc.value.status_code == 422


def test_local_time_conversion_uses_location_timezone_and_returns_utc():
    location = RentalLocation.model_validate({
        "id": "kyiv", "name": "Kyiv", "address": "Test address", "city": "Kyiv",
        "timeZone": "Europe/Kyiv", "vehicleIds": ["car_1"],
        "openingTime": "08:00", "closingTime": "20:00", "weekdays": [0, 1, 2, 3, 4, 5, 6],
    })
    result = local_to_utc(date(2030, 6, 3), time(10, 0), location)
    assert result.tzinfo == timezone.utc
    assert result.hour == 7  # Kyiv is UTC+3 on this date


def test_local_time_conversion_rejects_dst_gap_and_ambiguous_hour():
    location = RentalLocation.model_validate({
        "id": "kyiv", "name": "Kyiv", "address": "Test address", "city": "Kyiv",
        "timeZone": "Europe/Kyiv", "vehicleIds": ["car_1"],
        "openingTime": "00:00", "closingTime": "23:59", "weekdays": [0, 1, 2, 3, 4, 5, 6],
    })
    with pytest.raises(HTTPException, match="не існує"):
        local_to_utc(date(2025, 3, 30), time(3, 30), location)
    with pytest.raises(HTTPException, match="неоднозначний"):
        local_to_utc(date(2025, 10, 26), time(3, 30), location)


def test_local_time_conversion_enforces_opening_hours_and_workdays():
    location = RentalLocation.model_validate({
        "id": "kyiv", "name": "Kyiv", "address": "Test address", "city": "Kyiv",
        "timeZone": "Europe/Kyiv", "vehicleIds": ["car_1"],
        "openingTime": "09:00", "closingTime": "18:00", "weekdays": [0],
    })
    with pytest.raises(HTTPException, match="межах роботи"):
        local_to_utc(date(2030, 6, 3), time(8, 59), location)
    with pytest.raises(HTTPException, match="не працює"):
        local_to_utc(date(2030, 6, 4), time(10, 0), location)


class QueryResult:
    def __init__(self, exists=False):
        self.exists = exists

    def first(self):
        return ("occupied",) if self.exists else None


class FakeDb:
    def __init__(self, results=()):
        self.results = iter(results)

    async def execute(self, _statement):
        return QueryResult(next(self.results, False))


def period():
    start = datetime.now(timezone.utc) + timedelta(days=10)
    end = start + timedelta(days=2)
    return start, end, start.date(), end.date()


@pytest.mark.asyncio
async def test_availability_accepts_free_car_and_half_open_period():
    start, end, start_date, end_date = period()
    await validate_rental_period(FakeDb([False, False]), SimpleNamespace(id="car_1", available=True),
                                 start, end, start_date, end_date)


@pytest.mark.asyncio
async def test_availability_rejects_overlapping_booking():
    start, end, start_date, end_date = period()
    with pytest.raises(HTTPException) as exc:
        await validate_rental_period(FakeDb([True]), SimpleNamespace(id="car_1", available=True),
                                     start, end, start_date, end_date)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_availability_rejects_schedule_block():
    start, end, start_date, end_date = period()
    with pytest.raises(HTTPException) as exc:
        await validate_rental_period(FakeDb([False, True]), SimpleNamespace(id="car_1", available=True),
                                     start, end, start_date, end_date)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_availability_rejects_vehicle_not_yet_available():
    start, end, start_date, end_date = period()
    vehicle = SimpleNamespace(id="car_1", available=False, available_from=(start_date + timedelta(days=1)).isoformat())
    with pytest.raises(HTTPException) as exc:
        await validate_rental_period(FakeDb(), vehicle, start, end, start_date, end_date)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_availability_rejects_past_start_and_period_over_90_days():
    now = datetime.now(timezone.utc)
    vehicle = SimpleNamespace(id="car_1", available=True, available_from=None)
    with pytest.raises(HTTPException, match="майбутньому"):
        await validate_rental_period(FakeDb(), vehicle, now - timedelta(days=1), now + timedelta(days=1),
                                     (now - timedelta(days=1)).date(), (now + timedelta(days=1)).date())
    with pytest.raises(HTTPException, match="90 діб"):
        await validate_rental_period(FakeDb(), vehicle, now + timedelta(days=1), now + timedelta(days=92),
                                     (now + timedelta(days=1)).date(), (now + timedelta(days=92)).date())


def test_database_migration_keeps_overlap_guard_and_explicit_status_transitions():
    migration = (Path(__file__).parents[1] / "migrations" / "004_booking_integrity.sql").read_text()
    assert "EXCLUDE USING gist" in migration
    assert "tstzrange(start_at, end_at, '[)')" in migration
    assert "booking_status_transition_guard" in migration
    assert "('pending', 'confirmed')" in migration
    assert "('pending', 'cancelled')" in migration
    assert "('completed', 'pending')" not in migration
