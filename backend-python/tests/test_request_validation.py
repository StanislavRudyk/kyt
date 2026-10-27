import pytest
from pydantic import ValidationError

from app.schemas.booking import BookingCreateRequest, RentalPeriodRequest
from app.schemas.tariff import TariffCalculationRequest


def booking_payload(**changes):
    payload = {
        "vehicleId": "car_1", "pickupLocationId": "kyiv", "returnLocationId": "kyiv",
        "startDate": "2030-06-03", "startTime": "10:00",
        "endDate": "2030-06-05", "endTime": "10:00",
        "privacyNoticeAccepted": True, "fullName": "Test Customer",
        "phone": "+380 67 123 45 67", "email": "test@example.com",
    }
    return payload | changes


def test_booking_form_normalizes_name_and_blank_email():
    request = BookingCreateRequest.model_validate(booking_payload(fullName="  Anna  ", email="  "))
    assert request.fullName == "Anna"
    assert request.email is None


@pytest.mark.parametrize("changes", [
    {"fullName": " "}, {"fullName": "A"}, {"phone": "123"},
    {"email": "not-an-email"}, {"privacyNoticeAccepted": False},
    {"vehicleId": "../car"}, {"unexpected": "value"}, {"startTime": "25:90"},
])
def test_booking_form_rejects_invalid_or_unexpected_values(changes):
    with pytest.raises(ValidationError):
        BookingCreateRequest.model_validate(booking_payload(**changes))


@pytest.mark.parametrize("changes", [
    {"endDate": "2030-06-03", "endTime": "10:00"},
    {"endDate": "2030-06-02", "endTime": "10:00"},
])
def test_rental_period_rejects_return_at_or_before_pickup(changes):
    with pytest.raises(ValidationError):
        RentalPeriodRequest.model_validate(booking_payload(**changes))


@pytest.mark.parametrize("days", [0, -1, 91])
def test_tariff_request_rejects_out_of_range_duration(days):
    with pytest.raises(ValidationError):
        TariffCalculationRequest(vehicleId="car_1", days=days)


def test_tariff_request_rejects_invalid_vehicle_identifier():
    with pytest.raises(ValidationError):
        TariffCalculationRequest(vehicleId="../secret", days=1)
