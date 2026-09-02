from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    geometry = Column(Text, nullable=False)  # GeoJSON path
    distance_km = Column(Float, nullable=False, default=0.0)
    estimated_time = Column(String(50), nullable=False, default="0h 0m")
    safety_score = Column(Float, nullable=False, default=100.0)
    risk_score = Column(Float, nullable=False, default=0.0)
    logistics_priority = Column(String(20), nullable=False, default="NORMAL")
    created_at = Column(DateTime, default=datetime.utcnow)
