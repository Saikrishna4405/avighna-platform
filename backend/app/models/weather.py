from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(100), nullable=True)
    rainfall_mm = Column(Float, nullable=False, default=0.0)
    rainfall_intensity = Column(String(20), nullable=False, default="LIGHT") # LIGHT, MODERATE, HEAVY, EXTREME
    temperature = Column(Float, nullable=False, default=24.0)
    forecast_risk = Column(String(20), nullable=False, default="LOW") # LOW, MODERATE, HIGH, CRITICAL
    recorded_at = Column(DateTime, default=datetime.utcnow)
