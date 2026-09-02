from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.route import RouteRequest, RouteRecommendationResponse
from app.services.route_service import recommend_optimal_route

router = APIRouter(prefix="/routes", tags=["Route Recommendation Engine"])

@router.post("/recommend", response_model=RouteRecommendationResponse)
def get_recommended_route(request: RouteRequest, db: Session = Depends(get_db)):
    """
    Computes optimal, safe logistics route recommendations between origin and destination.
    Uses multi-criteria cost function balancing distance, travel time, terrain risk score,
    and vehicle cargo priority. Returns primary safety corridor and alternative detours.
    """
    return recommend_optimal_route(db, request)
