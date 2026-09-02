from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class LocationPoint(BaseModel):
    latitude: float
    longitude: float

class RouteRequest(BaseModel):
    origin: LocationPoint
    destination: LocationPoint
    origin_name: Optional[str] = "Guwahati"
    destination_name: Optional[str] = "Shillong"
    vehicle_type: str = "ESSENTIAL_SUPPLY"
    priority: str = "HIGH"

class AlternativeRoute(BaseModel):
    route_id: str
    route_name: str
    distance_km: float
    eta: str
    risk_score: float
    safety_score: float
    geometry: List[List[float]]
    status: str

class RouteRecommendationResponse(BaseModel):
    recommended_route: AlternativeRoute
    alternative_routes: List[AlternativeRoute]
    distance_km: float
    eta: str
    risk_score: float
    safety_score: float
    reason_for_selection: str
