#!/usr/bin/env python3
"""Read-only post-deploy smoke checks for the RentCar UA public site/API."""
import json
import os
import sys
from datetime import date, datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


BASE_URL = os.environ.get("BASE_URL", "").rstrip("/")
API_BASE_URL = os.environ.get("API_BASE_URL", "").rstrip("/")
if not BASE_URL:
    sys.exit("Set BASE_URL to the deployed site origin, e.g. https://rent.example")


def get(path, expected=200, base=BASE_URL):
    url = urljoin(base + "/", path.lstrip("/"))
    try:
        with urlopen(Request(url, headers={"Accept": "application/json,text/html"}), timeout=15) as response:
            body = response.read()
            if response.status != expected:
                raise RuntimeError(f"{path}: expected HTTP {expected}, got {response.status}")
            return response.headers.get_content_type(), body
    except HTTPError as exc:
        if exc.code == expected:
            return exc.headers.get_content_type(), exc.read()
        raise RuntimeError(f"{path}: expected HTTP {expected}, got {exc.code}") from exc
    except (URLError, TimeoutError) as exc:
        raise RuntimeError(f"{path}: request failed: {exc}") from exc


def json_get(path, base=BASE_URL):
    content_type, body = get(path, base=base)
    if content_type != "application/json":
        raise RuntimeError(f"{path}: expected JSON, got {content_type}")
    return json.loads(body)


def json_post(path, payload):
    url = urljoin(BASE_URL + "/", path.lstrip("/"))
    request = Request(url, data=json.dumps(payload).encode(), method="POST", headers={
        "Accept": "application/json", "Content-Type": "application/json",
    })
    try:
        with urlopen(request, timeout=15) as response:
            body = response.read()
            if response.status != 200:
                raise RuntimeError(f"{path}: expected HTTP 200, got {response.status}")
            if response.headers.get_content_type() != "application/json":
                raise RuntimeError(f"{path}: expected JSON response")
            return json.loads(body)
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"{path}: HTTP {exc.code}: {detail}") from exc
    except (URLError, TimeoutError) as exc:
        raise RuntimeError(f"{path}: request failed: {exc}") from exc


def verify_quote(vehicles, locations):
    for location in locations:
        zone = ZoneInfo(location["timeZone"])
        today = datetime.now(zone).date()
        for vehicle in vehicles:
            if vehicle["id"] not in location["vehicleIds"]:
                continue
            if not vehicle.get("available") and not vehicle.get("availableFrom"):
                continue
            for offset in range(2, 16):
                start = today + timedelta(days=offset)
                end = start + timedelta(days=1)
                if start.weekday() not in location["weekdays"] or end.weekday() not in location["weekdays"]:
                    continue
                if (not vehicle.get("available") and vehicle.get("availableFrom")
                        and start < date.fromisoformat(vehicle["availableFrom"])):
                    continue
                payload = {
                    "vehicleId": vehicle["id"],
                    "pickupLocationId": location["id"], "returnLocationId": location["id"],
                    "startDate": start.isoformat(), "startTime": location["openingTime"],
                    "endDate": end.isoformat(), "endTime": location["openingTime"],
                }
                try:
                    quote = json_post("/api/v1/bookings/quote", payload)
                    if quote.get("vehicleId") != vehicle["id"] or quote.get("totalAmount") != quote.get("subtotalAmount"):
                        raise RuntimeError("quote did not preserve vehicle identity or consistent total")
                    print("PASS read-only booking quote and server price calculation")
                    return
                except RuntimeError as exc:
                    # All configured cars can legitimately be booked for the
                    # candidate period. Try another valid vehicle/period first.
                    if "HTTP 409" in str(exc):
                        continue
                    raise
    print("SKIP booking quote: no configured location/vehicle/time window was available")


def main():
    failures = []
    for path in ("/", "/Inventory.html", "/Service.html", "/privacy.html", "/contract.html"):
        try:
            content_type, _ = get(path)
            if content_type != "text/html":
                raise RuntimeError(f"{path}: expected HTML, got {content_type}")
            print(f"PASS {path} HTTP 200")
        except Exception as exc:
            failures.append(str(exc))
            print(f"FAIL {exc}")

    api_data = {}
    for path in ("/api/v1/vehicles", "/api/v1/locations", "/api/v1/availability"):
        try:
            payload = json_get(path)
            api_data[path] = payload
            print(f"PASS {path} HTTP 200")
            if path.endswith("/vehicles") and not isinstance(payload, list):
                raise RuntimeError("vehicles API did not return a list")
            if path.endswith("/locations") and not isinstance(payload, list):
                raise RuntimeError("locations API did not return a list")
            if path.endswith("/availability") and not isinstance(payload.get("schedules"), dict):
                raise RuntimeError("availability API response is malformed")
        except Exception as exc:
            failures.append(str(exc))
            print(f"FAIL {exc}")

    try:
        get("/this-page-must-not-exist", expected=404)
        print("PASS unknown path returns HTTP 404")
    except Exception as exc:
        failures.append(str(exc))
        print(f"FAIL {exc}")

    if "/api/v1/vehicles" in api_data and "/api/v1/locations" in api_data:
        try:
            verify_quote(api_data["/api/v1/vehicles"], api_data["/api/v1/locations"])
        except Exception as exc:
            failures.append(str(exc))
            print(f"FAIL {exc}")

    if API_BASE_URL:
        for path, expected_status in (("/live", "alive"), ("/ready", "ready")):
            try:
                payload = json_get(path, base=API_BASE_URL)
                if payload.get("status") != expected_status:
                    raise RuntimeError(f"{path}: expected status={expected_status}")
                print(f"PASS private API {path}")
            except Exception as exc:
                failures.append(str(exc))
                print(f"FAIL {exc}")
    else:
        print("SKIP private API liveness/readiness: set API_BASE_URL to the API origin reachable from this runner")

    if failures:
        print(f"\n{len(failures)} smoke check(s) failed", file=sys.stderr)
        return 1
    print("\nAll read-only deployment smoke checks passed.")
    print("Booking creation, payment and customer confirmation are intentionally not submitted by this script.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
