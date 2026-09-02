from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String(150), nullable=False)
    road_code = Column(String(50), unique=True, index=True, nullable=False)
    geometry = Column(Text, nullable=False)  # GeoJSON string or WKT string
    start_lat = Column(Float, nullable=False, default=0.0)
    start_lon = Column(Float, nullable=False, default=0.0)
    end_lat = Column(Float, nullable=False, default=0.0)
    end_lon = Column(Float, nullable=False, default=0.0)
    length_km = Column(Float, nullable=False, default=0.0)
    elevation = Column(Float, nullable=False, default=500.0)
    slope = Column(Float, nullable=False, default=15.0)
    road_condition = Column(String(50), nullable=False, default="GOOD")
    # ACCESSIBLE, RISKY, BLOCKED
    accessibility_status = Column(String(50), nullable=False, default="ACCESSIBLE")
    current_risk_score = Column(Float, nullable=False, default=15.0)
    district = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
