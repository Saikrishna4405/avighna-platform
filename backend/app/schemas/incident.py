from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class IncidentCreate(BaseModel):
    incident_type: str  # LANDSLIDE, FLOOD, ROAD_DAMAGE, ROAD_BLOCKED, DEBRIS, BRIDGE_DAMAGE, OTHER
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    description: Optional[str] = None
    latitude: float
    longitude: float
    photo_url: Optional[str] = None
    district: Optional[str] = "Guwahati"

class IncidentResponse(BaseModel):
    id: int
    incident_type: str
    severity: str
    description: Optional[str]
    latitude: float
    longitude: float
    geometry: Optional[str]
    photo_url: Optional[str]
    reported_by: Optional[int]
    road_id: Optional[int]
    verification_status: str
    district: Optional[str]
    risk_score: Optional[float]
    ai_recommendation: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ImageAnalysisRequest(BaseModel):
    image_url: Optional[str] = None

class ImageAnalysisResponse(BaseModel):
    detected_condition: str
    severity: str
    confidence: float
    recommendation: str
