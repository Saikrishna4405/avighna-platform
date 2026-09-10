from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.verification import Verification
from app.models.incident import Incident
from app.models.road import Road
from app.models.user import User
from app.schemas.verification import VerificationRequest, VerificationResponse, PendingVerificationItem
from app.services.accessibility_service import evaluate_road_accessibility
from app.services.vehicle_service import auto_reroute_vehicles_on_corridor
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/verifications", tags=["Human Verification Pipeline"])

@router.get("/pending", response_model=List[PendingVerificationItem])
def get_pending_verifications(db: Session = Depends(get_db)):
    """
    Fetch field incident reports requiring human verification by authorized verifiers.
    """
    pending_incidents = db.query(Incident).filter(Incident.verification_status == "PENDING").all()
    results = []

    for inc in pending_incidents:
        item = PendingVerificationItem(
            id=inc.id,
            incident_id=inc.id,
            incident_type=inc.incident_type,
            severity=inc.severity,
            description=inc.description,
            latitude=inc.latitude,
            longitude=inc.longitude,
            photo_url=inc.photo_url,
            ai_risk_score=inc.risk_score,
            ai_recommendation=inc.ai_recommendation,
            created_at=inc.created_at
        )
        results.append(item)

    return results

@router.post("", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def submit_verification(
    req: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "VERIFIER", "DISTRICT_PLANNER", "FIELD_OFFICER", "LOGISTICS_OPERATOR", "PUBLIC_CITIZEN"]))
):
    """
    Submit verifier decision (VERIFIED / REJECTED) with remarks.
    If VERIFIED, updates corridor accessibility to BLOCKED and triggers vehicle auto-rerouting.
    """
    incident = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Store verification record
    verification = Verification(
        incident_id=req.incident_id,
        verifier_id=current_user.id,
        decision=req.decision,
        remarks=req.remarks
    )
    db.add(verification)

    # Update Incident status
    incident.verification_status = req.decision
    
    # If verified, trigger downstream corridor updates and vehicle rerouting
    if req.decision == "VERIFIED":
        if incident.road_id:
            road = db.query(Road).filter(Road.id == incident.road_id).first()
            if road:
                road.accessibility_status = "BLOCKED"
                road.current_risk_score = 88.0
                evaluate_road_accessibility(db, road)

                # Trigger vehicle rerouting on this corridor
                auto_reroute_vehicles_on_corridor(
                    db=db,
                    road_id=road.id,
                    reason=f"Human verification confirmed hazard ({incident.incident_type}) on corridor: {req.remarks or 'Corridor blocked'}"
                )

    db.commit()
    db.refresh(verification)
    return verification

@router.put("/{id}", response_model=VerificationResponse)
def update_verification(
    id: int,
    req: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "VERIFIER", "DISTRICT_PLANNER", "FIELD_OFFICER", "LOGISTICS_OPERATOR", "PUBLIC_CITIZEN"]))
):
    """
    Update an existing verification record.
    """
    v = db.query(Verification).filter(Verification.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")

    v.decision = req.decision
    v.remarks = req.remarks
    db.commit()
    db.refresh(v)
    return v
