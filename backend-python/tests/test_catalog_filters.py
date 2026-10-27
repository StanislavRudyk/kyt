import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.vehicle import Vehicle
from app.routers.vehicles import list_vehicles


def vehicle(vehicle_id, *, make, model, category, seats, price, year=2024):
    return Vehicle(
        id=vehicle_id, year=year, make=make, model=model, trim=None,
        category=category, body_type=None, fuel="Бензин",
        price_per_day=price, price_per_week=price * 6, price_per_month=price * 20,
        hp=300, zero_hundred=5.0, top_speed=250, drive="AWD", color="Black",
        location="Kyiv", img="car.webp", gallery=[], available=True, available_from=None,
        deposit=10_000, min_age=21, transmission="Автомат", seats=seats, trunk=300, km=1000,
    )


@pytest_asyncio.fixture
async def catalog_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Vehicle.__table__.create)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        session.add_all([
            vehicle("bmw-m4", make="BMW", model="M4", category="Спорт", seats=4, price=24_000),
            vehicle("porsche-911", make="Porsche", model="911", category="Спорт", seats=2, price=31_000),
            vehicle("tesla-s", make="Tesla", model="Model S", category="Електро", seats=5, price=19_000),
        ])
        await session.commit()
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_catalog_filters_intersect_and_sort_real_results(catalog_db):
    rows = await list_vehicles(
        category="Спорт", body=None, body_type=None, make=None, location=None,
        fuel=None, transmission=None, seats=4, min_price=20_000, max_price=30_000,
        search=None, available_only=False, sort="price_desc", db=catalog_db,
    )
    assert [row["id"] for row in rows] == ["bmw-m4"]
    assert rows[0]["pricePerDay"] == 24_000


@pytest.mark.asyncio
async def test_catalog_price_sort_changes_result_order(catalog_db):
    rows = await list_vehicles(
        category=None, body=None, body_type=None, make=None, location=None,
        fuel=None, transmission=None, seats=None, min_price=None, max_price=None,
        search=None, available_only=False, sort="price_asc", db=catalog_db,
    )
    assert [row["id"] for row in rows] == ["tesla-s", "bmw-m4", "porsche-911"]


@pytest.mark.asyncio
async def test_catalog_escaped_text_search_returns_matching_vehicle(catalog_db):
    rows = await list_vehicles(
        category=None, body=None, body_type=None, make=None, location=None,
        fuel=None, transmission=None, seats=None, min_price=None, max_price=None,
        search="Model S", available_only=False, sort="make_asc", db=catalog_db,
    )
    assert [row["id"] for row in rows] == ["tesla-s"]


@pytest.mark.asyncio
async def test_catalog_rejects_inverted_price_range(catalog_db):
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await list_vehicles(
            category=None, body=None, body_type=None, make=None, location=None,
            fuel=None, transmission=None, seats=None, min_price=30_000, max_price=20_000,
            search=None, available_only=False, sort="make_asc", db=catalog_db,
        )
    assert exc.value.status_code == 422
