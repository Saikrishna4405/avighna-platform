from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.road import Road
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.incident import IncidentCreate
from app.services.incident_service import create_incident_report
from app.routers.verification import submit_verification
from app.schemas.verification import VerificationRequest
from app.services.vehicle_service import auto_reroute_vehicles_on_corridor
from app.routers.dashboard import get_dashboard_summary

router = APIRouter(prefix="/demo", tags=["Interactive Demo Engine"])

@router.post("/run-scenario")
def run_demo_scenario(db: Session = Depends(get_db)):
    """
    Executes the complete 13-Step End-to-End Demonstration Scenario:
    Rainfall Increase -> AI Risk Evaluation (72/100 HIGH) -> Alert Created -> Field Verification ->
    Corridor BLOCKED -> Vehicle Discovered -> Alternate Route Recommendation -> Auto Rerouted -> ETA & Dashboard Updated.
    """
    logs: List[Dict[str, Any]] = []

    # Step 1: Heavy Rainfall detected
    logs.append({
        "step": 1,
        "title": "Meteorological Alert - Heavy Monsoon Rainfall",
        "detail": "Weather sensor detected 95.0mm/24h cumulative rainfall on Guwahati-Shillong Highway corridor.",
        "status": "COMPLETED"
    })

    # Step 2 & 3: Report Incident & Run ML Risk Engine
    inc_in = IncidentCreate(
        incident_type="LANDSLIDE",
        severity="HIGH",
        description="Massive slope collapse and debris obstruction reported near Nongpoh sector.",
        latitude=25.90,
        longitude=91.88,
        photo_url="landslide_field_photo_01.jpg",
        district="East Khasi Hills"
    )
    incident = create_incident_report(db, inc_in)
    
    logs.append({
        "step": 2,
        "title": "Hazard & Terrain Risk Assessment",
        "detail": f"Risk assessment model evaluated slope and weather data. Corridor Vulnerability Score: {incident.risk_score}/100 (HIGH). Contributing Factors: Heavy Precipitation, Steep Slope (38°), Infrastructure Degradation.",
        "status": "COMPLETED",
        "incident_id": incident.id
    })

    # Step 4 & 5: High Risk Alert & Verification Request Created
    logs.append({
        "step": 3,
        "title": "Alert Generation & Field Verifier Dispatch",
        "detail": f"System generated HIGH-RISK alert and created Verification Request for incident #{incident.id}.",
        "status": "COMPLETED"
    })

    # Step 6 & 7: Verifier Approves -> Corridor status becomes BLOCKED
    verifier_user = db.query(User).filter(User.role.in_(["VERIFIER", "ADMIN"])).first()
    verifier_id = verifier_user.id if verifier_user else 1

    ver_req = VerificationRequest(
        incident_id=incident.id,
        decision="VERIFIED",
        remarks="Field officer physically confirmed 15m landslide road blockage. Corridor impassable."
    )
    
    # Manually trigger verification logic
    incident.verification_status = "VERIFIED"
    target_road = db.query(Road).filter(Road.id == incident.road_id).first() if incident.road_id else db.query(Road).first()
    
    if target_road:
        target_road.accessibility_status = "BLOCKED"
        target_road.current_risk_score = 92.0
    db.commit()

    logs.append({
        "step": 4,
        "title": "Field Verification Approved -> Corridor Blocked",
        "detail": f"District verifier approved incident #{incident.id}. Road corridor '{target_road.road_name if target_road else 'Guwahati-Shillong Highway'}' status updated to BLOCKED.",
        "status": "COMPLETED"
    })

    # Step 8, 9, 10 & 11: Identify affected vehicles & calculate alternative safe route
    road_id_to_avoid = target_road.id if target_road else 1
    reroute_results = auto_reroute_vehicles_on_corridor(
        db=db,
        road_id=road_id_to_avoid,
        reason="Corridor Guwahati-Shillong Highway confirmed BLOCKED by Landslide"
    )

    rerouted_summary = []
    for r in reroute_results:
        rerouted_summary.append(f"Vehicle {r['vehicle_number']}: Rerouted to '{r['new_route']}' (New ETA: {r['new_eta']})")

    logs.append({
        "step": 5,
        "title": "Automated Route Recalculation & Vehicle Dispatch",
        "detail": f"Identified active logistics vehicles on affected corridor. Calculated safe bypass. Rerouted {len(reroute_results)} vehicle(s).",
        "results": rerouted_summary,
        "status": "COMPLETED"
    })

    # Step 12 & 13: Dashboard Summary Updated
    summary = get_dashboard_summary(db)
    logs.append({
        "step": 6,
        "title": "Command Center KPIs Updated",
        "detail": f"Updated KPIs -> Active Incidents: {summary['active_incidents']}, Blocked Roads: {summary['blocked_roads']}, Vehicles Rerouted: {summary['vehicles_rerouted']}.",
        "summary_kpis": summary,
        "status": "COMPLETED"
    })

    return {
        "status": "SUCCESS",
        "message": "End-to-End Demo Scenario completed successfully.",
        "execution_steps": logs,
        "dashboard_summary": summary
    }
