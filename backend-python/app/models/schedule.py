from sqlalchemy import Column, Integer, String, Date, UniqueConstraint
from app.database import Base

class VehicleSchedule(Base):
    __tablename__ = "vehicle_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(30), default="booked")  # 'booked', 'maintenance'
    booking_id = Column(String(20), nullable=True)

    __table_args__ = (
        UniqueConstraint('vehicle_id', 'date', name='uq_vehicle_date'),
    )
