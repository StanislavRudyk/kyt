from sqlalchemy import select, text
from app.database import AsyncSessionLocal, engine, Base
from app.models.vehicle import Vehicle
from app.models.schedule import VehicleSchedule

INITIAL_VEHICLES = [
    {
        "id": "huracan-evo", "year": 2021, "make": "Lamborghini", "model": "Huracán EVO", "trim": "V10 AWD",
        "category": "Спорт", "fuel": "Бензин", "price_per_day": 12500, "price_per_week": 75000, "price_per_month": 250000,
        "hp": 602, "zero_hundred": 2.9, "top_speed": 325, "drive": "AWD", "color": "Giallo Belenus",
        "location": "Київ", "img": "huracan-yellow",
        "gallery": ["huracan-yellow", "huracan-cockpit", "huracan-rear", "huracan-studio"],
        "available": True, "deposit": 50000, "min_age": 25, "transmission": "Автомат", "seats": 2, "trunk": 100, "km": 12400
    },
    {
        "id": "model-s-plaid", "year": 2023, "make": "Tesla", "model": "Model S Plaid", "trim": "Tri-Motor",
        "category": "Електро", "fuel": "Електро", "price_per_day": 4500, "price_per_week": 27000, "price_per_month": 90000,
        "hp": 1020, "zero_hundred": 2.1, "top_speed": 322, "drive": "AWD", "color": "Midnight Silver",
        "location": "Київ", "img": "tesla-model-s-plaid", "gallery": ["tesla-model-s-plaid"],
        "available": True, "deposit": 25000, "min_age": 21, "transmission": "Автомат", "seats": 5, "trunk": 793, "km": 22800
    },
    {
        "id": "911-carrera-s", "year": 2022, "make": "Porsche", "model": "911 Carrera S", "trim": "992 PDK",
        "category": "Спорт", "fuel": "Бензин", "price_per_day": 7500, "price_per_week": 45000, "price_per_month": 150000,
        "hp": 443, "zero_hundred": 3.7, "top_speed": 308, "drive": "RWD", "color": "GT Silver",
        "location": "Одеса", "img": "porsche-911-carrera-s", "gallery": ["porsche-911-carrera-s"],
        "available": True, "deposit": 35000, "min_age": 23, "transmission": "Автомат", "seats": 4, "trunk": 132, "km": 15100
    },
    {
        "id": "range-rover-sport", "year": 2022, "make": "Land Rover", "model": "Range Rover Sport", "trim": "P400 HSE",
        "category": "Позашляховик", "fuel": "Бензин", "price_per_day": 5200, "price_per_week": 31200, "price_per_month": 104000,
        "hp": 395, "zero_hundred": 6.2, "top_speed": 225, "drive": "AWD", "color": "Santorini Black",
        "location": "Львів", "img": "range-rover-sport", "gallery": ["range-rover-sport"],
        "available": False, "available_from": "2026-11-05", "deposit": 20000, "min_age": 21, "transmission": "Автомат", "seats": 5, "trunk": 489, "km": 29900
    },
    {
        "id": "amg-gt", "year": 2021, "make": "Mercedes-AMG", "model": "GT Coupé", "trim": "V8 Biturbo",
        "category": "Спорт", "fuel": "Бензин", "price_per_day": 6800, "price_per_week": 40800, "price_per_month": 136000,
        "hp": 523, "zero_hundred": 3.7, "top_speed": 310, "drive": "RWD", "color": "Obsidian Black",
        "location": "Київ", "img": "mercedes-amg-gt", "gallery": ["mercedes-amg-gt"],
        "available": True, "deposit": 30000, "min_age": 23, "transmission": "Автомат", "seats": 2, "trunk": 165, "km": 19500
    },
    {
        "id": "f150-raptor", "year": 2022, "make": "Ford", "model": "F-150 Raptor", "trim": "3.5L EcoBoost",
        "category": "Пікап", "fuel": "Бензин", "price_per_day": 4200, "price_per_week": 25200, "price_per_month": 84000,
        "hp": 450, "zero_hundred": 5.3, "top_speed": 190, "drive": "4WD", "color": "Code Orange",
        "location": "Харків", "img": "ford-f150-raptor", "gallery": ["ford-f150-raptor"],
        "available": True, "deposit": 18000, "min_age": 21, "transmission": "Автомат", "seats": 5, "trunk": 0, "km": 34300
    },
    {
        "id": "rx-450h", "year": 2023, "make": "Lexus", "model": "RX 450h", "trim": "AWD Hybrid",
        "category": "Гібрид", "fuel": "Гібрид", "price_per_day": 3800, "price_per_week": 22800, "price_per_month": 76000,
        "hp": 308, "zero_hundred": 7.7, "top_speed": 200, "drive": "AWD", "color": "Nori Green",
        "location": "Одеса", "img": "lexus-rx-450h", "gallery": ["lexus-rx-450h"],
        "available": True, "deposit": 15000, "min_age": 21, "transmission": "Автомат", "seats": 5, "trunk": 461, "km": 19000
    },
    {
        "id": "m4-competition", "year": 2022, "make": "BMW", "model": "M4 Competition", "trim": "xDrive",
        "category": "Спорт", "fuel": "Бензин", "price_per_day": 5500, "price_per_week": 33000, "price_per_month": 110000,
        "hp": 503, "zero_hundred": 3.5, "top_speed": 290, "drive": "AWD", "color": "Isle of Man Green",
        "location": "Дніпро", "img": "bmw-m4-competition", "gallery": ["bmw-m4-competition"],
        "available": True, "deposit": 22000, "min_age": 23, "transmission": "Автомат", "seats": 4, "trunk": 440, "km": 14300
    },
    {
        "id": "etron-gt", "year": 2023, "make": "Audi", "model": "e-tron GT", "trim": "quattro",
        "category": "Електро", "fuel": "Електро", "price_per_day": 5000, "price_per_week": 30000, "price_per_month": 100000,
        "hp": 522, "zero_hundred": 4.1, "top_speed": 245, "drive": "AWD", "color": "Daytona Grey",
        "location": "Київ", "img": "audi-etron-gt", "gallery": ["audi-etron-gt"],
        "available": False, "available_from": "2026-11-12", "deposit": 25000, "min_age": 21, "transmission": "Автомат", "seats": 5, "trunk": 405, "km": 12100
    }
]

async def seed_data():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("""
            CREATE OR REPLACE FUNCTION enforce_booking_status_transition() RETURNS trigger AS $$
            BEGIN
                IF NEW.status = OLD.status THEN RETURN NEW; END IF;
                IF (OLD.status, NEW.status) NOT IN (
                    ('pending', 'confirmed'), ('pending', 'cancelled'),
                    ('confirmed', 'paid'), ('confirmed', 'cancelled'),
                    ('paid', 'active'), ('active', 'completed')
                ) THEN
                    RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status
                        USING ERRCODE = 'check_violation';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            DROP TRIGGER IF EXISTS booking_status_transition_guard ON bookings;
            CREATE TRIGGER booking_status_transition_guard
                BEFORE UPDATE OF status ON bookings
                FOR EACH ROW EXECUTE FUNCTION enforce_booking_status_transition();
        """))

    async with AsyncSessionLocal() as session:
        # Перевірка наявності авто
        result = await session.execute(select(Vehicle.id))
        existing = set(result.scalars().all())

        for v_data in INITIAL_VEHICLES:
            if v_data["id"] not in existing:
                session.add(Vehicle(**v_data))
        
        await session.commit()
