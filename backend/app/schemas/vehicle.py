from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str = "ESSENTIAL_SUPPLY"
    latitude: float
    longitude: float
    origin: Optional[str] = "Guwahati"
    destination: str = "Shillong"
    priority: str = "HIGH"  # CRITICAL, HIGH, NORMAL, LOW
    cargo_type: str = "Emergency Supplies"

class VehicleLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    status: Optional[str] = None

class VehicleRerouteRequest(BaseModel):
    avoid_road_id: Optional[int] = None
    reason: Optional[str] = "Road blocked/high risk"

class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    latitude: float
    longitude: float
    origin: Optional[str]
    destination: str
    status: str
    current_route: Optional[str]
    assigned_road_ids: Optional[str]
    eta: Optional[str]
    priority: str
    cargo_type: str
    updated_at: datetime

    class Config:
        from_attributes = True

class RerouteResponse(BaseModel):
    vehicle_id: int
    old_route: str
    new_route: str
    old_eta: str
    new_eta: str
    reason: str
    safety_score: float
