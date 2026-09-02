from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class RoadResponse(BaseModel):
    id: int
    road_name: str
    road_code: str
    geometry: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    length_km: float
    elevation: float
    slope: float
    road_condition: str
    accessibility_status: str  # ACCESSIBLE, RISKY, BLOCKED
    current_risk_score: float
    district: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True

class AccessibilityStatusUpdate(BaseModel):
    accessibility_status: str
    reason: Optional[str] = None
