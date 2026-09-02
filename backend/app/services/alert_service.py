from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.alert import Alert

def create_system_alert(
    db: Session,
    alert_type: str,
    severity: str,
    message: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    corridor_id: Optional[int] = None,
    vehicle_id: Optional[int] = None
) -> Alert:
    alert = Alert(
        alert_type=alert_type,
        severity=severity,
        message=message,
        latitude=latitude,
        longitude=longitude,
        corridor_id=corridor_id,
        vehicle_id=vehicle_id,
        status="ACTIVE"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def get_active_alerts(db: Session, limit: int = 50) -> List[Alert]:
    return db.query(Alert).order_by(Alert.created_at.desc()).limit(limit).all()
