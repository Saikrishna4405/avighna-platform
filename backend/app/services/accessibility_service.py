import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.road import Road
from app.models.incident import Incident
from app.utils.gis import to_geojson_feature_collection

def evaluate_road_accessibility(db: Session, road: Road) -> str:
    """
    Evaluates and updates the accessibility status of a road corridor.
    Statuses: ACCESSIBLE, RISKY, BLOCKED
    """
    # Check if there is a verified blockage or severe incident on this road
    verified_blockage = db.query(Incident).filter(
        Incident.road_id == road.id,
        Incident.verification_status == "VERIFIED",
        Incident.incident_type.in_(["LANDSLIDE", "FLOOD", "ROAD_BLOCKED", "BRIDGE_DAMAGE"])
    ).first()

    if verified_blockage:
        status = "BLOCKED"
    elif road.current_risk_score >= 70.0:
        status = "BLOCKED"
    elif road.current_risk_score >= 45.0 or road.road_condition == "POOR":
        status = "RISKY"
    else:
        status = "ACCESSIBLE"

    if road.accessibility_status != status:
        road.accessibility_status = status
        db.commit()
        db.refresh(road)

    return status

def get_roads_accessibility_geojson(db: Session) -> Dict[str, Any]:
    roads = db.query(Road).all()
    features = []

    for road in roads:
        # Latest incident on this road
        latest_inc = db.query(Incident).filter(Incident.road_id == road.id).order_by(Incident.created_at.desc()).first()
        inc_desc = latest_inc.incident_type if latest_inc else None

        # Parse geometry string into JSON coordinates
        try:
            geom = json.loads(road.geometry)
        except Exception:
            geom = {
                "type": "LineString",
                "coordinates": [[road.start_lon, road.start_lat], [road.end_lon, road.end_lat]]
            }

        risk_level = "LOW"
        if road.current_risk_score > 70: risk_level = "CRITICAL"
        elif road.current_risk_score > 50: risk_level = "HIGH"
        elif road.current_risk_score > 30: risk_level = "MODERATE"

        feature = {
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "road_id": road.id,
                "road_name": road.road_name,
                "road_code": road.road_code,
                "accessibility_status": road.accessibility_status,
                "risk_score": road.current_risk_score,
                "risk_level": risk_level,
                "length_km": road.length_km,
                "elevation": road.elevation,
                "slope": road.slope,
                "latest_incident": inc_desc,
                "updated_at": road.updated_at.isoformat() if road.updated_at else None
            }
        }
        features.append(feature)

    return to_geojson_feature_collection(features)
