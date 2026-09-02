from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class WeatherResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    location_name: Optional[str]
    rainfall_mm: float
    rainfall_intensity: str
    temperature: float
    forecast_risk: str
    recorded_at: datetime

    class Config:
        from_attributes = True

class RiskPredictRequest(BaseModel):
    latitude: float
    longitude: float
    rainfall: float = 0.0
    slope: float = 15.0
    elevation: float = 500.0
    road_condition: str = "POOR"  # GOOD, FAIR, POOR, CRITICAL
    historical_incidents: int = 0
    cumulative_rainfall_3d: Optional[float] = 0.0

class RiskPredictResponse(BaseModel):
    risk_score: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    reasons: List[str]
    recommended_action: str
