from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.road import Road
from app.schemas.route import RouteRequest, RouteRecommendationResponse, AlternativeRoute
from app.utils.routing_graph import find_best_routes

def recommend_optimal_route(db: Session, request: RouteRequest) -> RouteRecommendationResponse:
    roads = db.query(Road).all()

    primary, alts = find_best_routes(
        roads=roads,
        origin_name=request.origin_name or "Guwahati",
        destination_name=request.destination_name or "Shillong",
        vehicle_type=request.vehicle_type,
        priority=request.priority
    )

    primary_alt = AlternativeRoute(**primary)
    alt_models = [AlternativeRoute(**a) for a in alts]

    reason = (
        f"Selected route balances travel distance ({primary['distance_km']} km) "
        f"with high safety score ({primary['safety_score']}/100) avoiding active landslide risk zones."
    )

    return RouteRecommendationResponse(
        recommended_route=primary_alt,
        alternative_routes=alt_models,
        distance_km=primary["distance_km"],
        eta=primary["eta"],
        risk_score=primary["risk_score"],
        safety_score=primary["safety_score"],
        reason_for_selection=reason
    )
