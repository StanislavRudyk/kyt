import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, JSON, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(20), primary_key=True)  # 'RC-849201'
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    request_hash = Column(String(64), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    pickup_time = Column(String(5), nullable=False, default="09:00")
    return_time = Column(String(5), nullable=False, default="09:00")
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    pickup_location_id = Column(String(50), nullable=False)
    pickup_location_name = Column(String(100), nullable=False)
    pickup_address = Column(String(250), nullable=False)
    pickup_timezone = Column(String(80), nullable=False)
    return_location_id = Column(String(50), nullable=False)
    return_location_name = Column(String(100), nullable=False)
    return_address = Column(String(250), nullable=False)
    return_timezone = Column(String(80), nullable=False)
    privacy_notice_accepted = Column(Boolean, nullable=False, default=False)
    days = Column(Integer, nullable=False)
    
    # payment_pending намеренно отсутствует: платёжного провайдера нет.
    # Статусы зарезервированы для будущего защищённого workflow.
    status = Column(String(30), default="pending", nullable=False)
    
    base_amount = Column(Integer, nullable=False)
    daily_rate_snapshot = Column(Integer, nullable=False)
    discount_amount = Column(Integer, default=0)
    insurance_amount = Column(Integer, default=0)
    total_amount = Column(Integer, nullable=False)
    
    deposit_amount = Column(Integer, nullable=False)
    deposit_status = Column(String(50), default="Не сплачено")
    
    location = Column(String(100), nullable=False)
    extras = Column(JSON, default=list)  # ['Повне КАСКО', 'GPS-навігатор']
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    vehicle = relationship("Vehicle")

    __table_args__ = (
        CheckConstraint("end_at > start_at", name="booking_period_positive"),
        CheckConstraint("status IN ('pending', 'confirmed', 'paid', 'active', 'completed', 'cancelled')", name="booking_status_allowed"),
        CheckConstraint("days > 0 AND base_amount >= 0 AND total_amount >= 0 AND deposit_amount >= 0", name="booking_amounts_nonnegative"),
        ExcludeConstraint(
            ("vehicle_id", "="),
            (func.tstzrange(start_at, end_at, "[)"), "&&"),
            where=status.in_(["pending", "confirmed", "paid", "active"]),
            using="gist",
            name="booking_vehicle_period_no_overlap",
        ),
    )


class BookingEvent(Base):
    __tablename__ = "booking_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(20), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(40), nullable=False)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    note = Column(String(500), nullable=False, default="")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
