from fastapi import APIRouter
from app.schemas.weather import RiskPredictRequest, RiskPredictResponse
from app.ml.prediction import predict_terrain_risk

router = APIRouter(prefix="/risk", tags=["AI Risk Prediction Engine"])

@router.post("/predict", response_model=RiskPredictResponse)
def predict_risk(req: RiskPredictRequest):
    """
    Executes Machine Learning risk model on topographical and meteorological inputs
    (rainfall intensity, slope gradient, elevation, road condition, historical incidents).
    Returns risk score (0-100), risk level (LOW/MODERATE/HIGH/CRITICAL), contributing factors,
    and recommended operational actions.
    """
    res = predict_terrain_risk(
        latitude=req.latitude,
        longitude=req.longitude,
        rainfall=req.rainfall,
        slope=req.slope,
        elevation=req.elevation,
        road_condition=req.road_condition,
        historical_incidents=req.historical_incidents,
        nearby_incidents=1
    )
    return RiskPredictResponse(**res)
