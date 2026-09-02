from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertAcknowledge
from app.services.alert_service import get_active_alerts

router = APIRouter(prefix="/alerts", tags=["System Alerts & Live Warnings"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    """
    Retrieve live system alerts sorted by most recent.
    """
    return get_active_alerts(db)

@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, ack: AlertAcknowledge, db: Session = Depends(get_db)):
    """
    Acknowledge an active alert.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = ack.status
    db.commit()
    db.refresh(alert)
    return alert
