from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.road import Road
from app.schemas.road import RoadResponse, AccessibilityStatusUpdate
from app.services.accessibility_service import get_roads_accessibility_geojson, evaluate_road_accessibility
from app.services.vehicle_service import auto_reroute_vehicles_on_corridor
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/roads", tags=["Road Network & Accessibility"])

@router.get("", response_model=List[RoadResponse])
def get_all_roads(db: Session = Depends(get_db)):
    """
    Retrieve all road corridors in the North Eastern Region dataset.
    """
    return db.query(Road).all()

@router.get("/accessibility")
def get_roads_accessibility(db: Session = Depends(get_db)):
    """
    Returns standard GeoJSON FeatureCollection of all road corridors with current accessibility status,
    risk scores, and hazard metadata for GIS Leaflet mapping.
    """
    return get_roads_accessibility_geojson(db)

@router.get("/{road_id}", response_model=RoadResponse)
def get_road_details(road_id: int, db: Session = Depends(get_db)):
    """
    Get detailed metrics for a specific road corridor.
    """
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")
    return road

@router.put("/{road_id}/accessibility", response_model=RoadResponse)
def update_road_accessibility(
    road_id: int,
    status_update: AccessibilityStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["ADMIN", "DISTRICT_PLANNER", "VERIFIER"]))
):
    """
    Manually override accessibility status (ACCESSIBLE, RISKY, BLOCKED).
    If status is set to BLOCKED, automatically triggers rerouting of affected vehicles.
    """
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")

    road.accessibility_status = status_update.accessibility_status
    if status_update.accessibility_status == "BLOCKED":
        road.current_risk_score = 90.0
    db.commit()
    db.refresh(road)

    if status_update.accessibility_status == "BLOCKED":
        auto_reroute_vehicles_on_corridor(
            db=db,
            road_id=road.id,
            reason=status_update.reason or f"Corridor accessibility manually set to BLOCKED by {current_user.name}"
        )

    return road
