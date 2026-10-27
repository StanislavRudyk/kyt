from sqlalchemy import Column, String, Integer, Float, Boolean, JSON
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(50), primary_key=True)  # 'huracan-evo', 'model-s-plaid'
    year = Column(Integer, nullable=False)
    make = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    trim = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False)  # Єдина категорія каталогу
    body_type = Column(String(50), nullable=True)  # Напр. седан/купе; не вигадувати, якщо невідомо
    fuel = Column(String(50), nullable=False)

    price_per_day = Column(Integer, nullable=False)
    price_per_week = Column(Integer, nullable=False)
    price_per_month = Column(Integer, nullable=False)

    hp = Column(Integer, nullable=False)
    zero_hundred = Column(Float, nullable=False)
    top_speed = Column(Integer, nullable=False)
    drive = Column(String(20), nullable=False)
    color = Column(String(50), nullable=False)
    location = Column(String(50), nullable=False)
    img = Column(String(100), nullable=False)
    gallery = Column(JSON, default=list)

    available = Column(Boolean, default=True)
    available_from = Column(String(50), nullable=True)
    deposit = Column(Integer, nullable=False)
    min_age = Column(Integer, default=21)
    transmission = Column(String(50), default="Автомат")
    seats = Column(Integer, default=5)
    trunk = Column(Integer, default=400)
    km = Column(Integer, default=10000)
