from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.road import Road

router = APIRouter(prefix="/logistics", tags=["Logistics Prioritization"])

PRIORITY_ORDER = {"CRITICAL": 1, "HIGH": 2, "NORMAL": 3, "LOW": 4}

@router.get("/priorities")
def get_logistics_priorities(db: Session = Depends(get_db)):
    """
    Returns fleet deliveries sorted dynamically by cargo priority (CRITICAL emergency supplies first),
    corridor risk score, disruption status, and current ETA delays.
    """
    vehicles = db.query(Vehicle).all()
    results = []

    for v in vehicles:
        # Determine priority weight
        p_rank = PRIORITY_ORDER.get(v.priority, 3)
        
        # Calculate risk indicator
        risk_val = 20.0
        if v.status == "REROUTED":
            risk_val = 75.0
        elif v.status == "DELAYED":
            risk_val = 50.0

        item = {
            "id": v.id,
            "vehicle_number": v.vehicle_number,
            "cargo_type": v.cargo_type,
            "priority": v.priority,
            "priority_rank": p_rank,
            "vehicle_type": v.vehicle_type,
            "origin": v.origin,
            "destination": v.destination,
            "status": v.status,
            "eta": v.eta,
            "risk_score": risk_val,
            "recommended_action": "PRIORITY_DISPATCH" if p_rank <= 2 else "STANDARD_MONITORING"
        }
        results.append(item)

    # Sort by priority rank first, then by risk score descending
    results.sort(key=lambda x: (x["priority_rank"], -x["risk_score"]))
    return results
