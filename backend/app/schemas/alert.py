from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    latitude: Optional[float]
    longitude: Optional[float]
    corridor_id: Optional[int]
    vehicle_id: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledge(BaseModel):
    status: str = "ACKNOWLEDGED"
