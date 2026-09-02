from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class VerificationRequest(BaseModel):
    incident_id: int
    decision: str  # VERIFIED or REJECTED
    remarks: Optional[str] = None

class VerificationResponse(BaseModel):
    id: int
    incident_id: int
    verifier_id: Optional[int]
    decision: str
    remarks: Optional[str]
    verified_at: datetime

    class Config:
        from_attributes = True

class PendingVerificationItem(BaseModel):
    id: int
    incident_id: int
    incident_type: str
    severity: str
    description: Optional[str]
    latitude: float
    longitude: float
    photo_url: Optional[str]
    ai_risk_score: Optional[float]
    ai_recommendation: Optional[str]
    created_at: datetime
