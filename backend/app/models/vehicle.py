from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # ESSENTIAL_SUPPLY, MEDICAL, FOOD, CARGO
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    origin = Column(String(100), nullable=True)
    destination = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False, default="ACTIVE")
    # ACTIVE, DELAYED, REROUTED, STOPPED, COMPLETED
    current_route = Column(Text, nullable=True)  # JSON geometry string
    assigned_road_ids = Column(Text, nullable=True) # comma-separated road ids in route
    eta = Column(String(50), nullable=True)
    priority = Column(String(20), nullable=False, default="NORMAL")
    # CRITICAL, HIGH, NORMAL, LOW
    cargo_type = Column(String(100), nullable=False, default="General Goods")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
