import json
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.road import Road
from app.schemas.incident import IncidentCreate
from app.utils.gis import find_nearest_road
from app.ml.prediction import predict_terrain_risk
from app.ml.image_analysis import analyze_field_image
from app.services.alert_service import create_system_alert
from app.services.accessibility_service import evaluate_road_accessibility

def create_incident_report(db: Session, incident_in: IncidentCreate, reported_by_user_id: Optional[int] = None) -> Incident:
    # 1. Image CV analysis if photo provided
    cv_result = None
    if incident_in.photo_url:
        cv_result = analyze_field_image(incident_in.photo_url)

    # 2. Nearest Road Matching
    nearest_road, dist_km = find_nearest_road(incident_in.latitude, incident_in.longitude, db)
    road_id = nearest_road.id if nearest_road else None

    # 3. AI Risk Prediction
    road_cond = nearest_road.road_condition if nearest_road else "POOR"
    slope_val = nearest_road.slope if nearest_road else 25.0
    elev_val = nearest_road.elevation if nearest_road else 800.0
    
    # Query recent incidents count near this location
    recent_count = db.query(Incident).filter(Incident.road_id == road_id).count() if road_id else 0

    risk_pred = predict_terrain_risk(
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        rainfall=85.0 if incident_in.incident_type in ["FLOOD", "LANDSLIDE"] else 30.0,
        slope=slope_val,
        elevation=elev_val,
        road_condition=road_cond,
        historical_incidents=recent_count,
        nearby_incidents=1
    )

    ai_rec = risk_pred.get("recommended_action", "Request field verification")
    if cv_result:
        ai_rec += f" (CV detected: {cv_result['detected_condition']} with {int(cv_result['confidence']*100)}% confidence)"

    # GeoJSON geometry point representation
    geom_str = json.dumps({
        "type": "Point",
        "coordinates": [incident_in.longitude, incident_in.latitude]
    })

    # 4. Store Incident
    incident = Incident(
        incident_type=incident_in.incident_type,
        severity=incident_in.severity,
        description=incident_in.description,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        geometry=geom_str,
        photo_url=incident_in.photo_url,
        reported_by=reported_by_user_id,
        road_id=road_id,
        verification_status="PENDING",
        district=incident_in.district or (nearest_road.district if nearest_road else "Guwahati"),
        risk_score=risk_pred["risk_score"],
        ai_recommendation=ai_rec
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # 5. Update Road Risk & Accessibility
    if nearest_road:
        nearest_road.current_risk_score = max(nearest_road.current_risk_score, risk_pred["risk_score"])
        evaluate_road_accessibility(db, nearest_road)

    # 6. Generate Alert if high/critical
    if incident_in.severity in ["HIGH", "CRITICAL"] or risk_pred["risk_score"] >= 65.0:
        create_system_alert(
            db=db,
            alert_type=f"{incident_in.incident_type}_ALERT",
            severity=incident_in.severity,
            message=f"{incident_in.severity} hazard reported: {incident_in.incident_type} at ({incident_in.latitude}, {incident_in.longitude}). {ai_rec}",
            latitude=incident_in.latitude,
            longitude=incident_in.longitude,
            corridor_id=road_id
        )

    return incident
