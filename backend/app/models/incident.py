from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String(50), nullable=False)
    # LANDSLIDE, FLOOD, ROAD_DAMAGE, ROAD_BLOCKED, DEBRIS, BRIDGE_DAMAGE, OTHER
    severity = Column(String(20), nullable=False, default="MEDIUM")
    # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=True)
    verification_status = Column(String(20), nullable=False, default="PENDING")
    # PENDING, VERIFIED, REJECTED
    district = Column(String(100), nullable=True)
    risk_score = Column(Float, nullable=True, default=0.0)
    ai_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
