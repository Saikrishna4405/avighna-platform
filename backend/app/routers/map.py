import json
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.road import Road
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.models.alert import Alert
from app.services.accessibility_service import get_roads_accessibility_geojson
from app.utils.gis import to_geojson_feature_collection

router = APIRouter(prefix="/map", tags=["GIS & Map GeoJSON Engine"])

@router.get("/roads")
def get_map_roads(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of all road corridors colored by accessibility and risk level.
    """
    return get_roads_accessibility_geojson(db)

@router.get("/incidents")
def get_map_incidents(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of active incident points.
    """
    incidents = db.query(Incident).all()
    features = []

    for inc in incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc.longitude, inc.latitude]
            },
            "properties": {
                "id": inc.id,
                "incident_type": inc.incident_type,
                "severity": inc.severity,
                "description": inc.description,
                "photo_url": inc.photo_url,
                "verification_status": inc.verification_status,
                "risk_score": inc.risk_score,
                "district": inc.district
            }
        })

    return to_geojson_feature_collection(features)

@router.get("/vehicles")
def get_map_vehicles(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of fleet vehicles with current GPS coordinates.
    """
    vehicles = db.query(Vehicle).all()
    features = []

    for v in vehicles:
        route_geom = None
        if v.current_route:
            try:
                route_geom = json.loads(v.current_route)
            except Exception:
                pass

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [v.longitude, v.latitude]
            },
            "properties": {
                "id": v.id,
                "vehicle_number": v.vehicle_number,
                "vehicle_type": v.vehicle_type,
                "status": v.status,
                "priority": v.priority,
                "cargo_type": v.cargo_type,
                "destination": v.destination,
                "eta": v.eta,
                "route_geometry": route_geom
            }
        })

    return to_geojson_feature_collection(features)

@router.get("/alerts")
def get_map_alerts(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of active geo-tagged alerts.
    """
    alerts = db.query(Alert).filter(Alert.latitude.isnot(None), Alert.status == "ACTIVE").all()
    features = []

    for a in alerts:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [a.longitude, a.latitude]
            },
            "properties": {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "corridor_id": a.corridor_id
            }
        })

    return to_geojson_feature_collection(features)
