from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentResponse, ImageAnalysisRequest, ImageAnalysisResponse
from app.services.incident_service import create_incident_report
from app.ml.image_analysis import analyze_field_image
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Report a new field incident. Automatically matches nearest road, calculates preliminary risk,
    generates system alerts, and queues human verification for critical cases.
    """
    return create_incident_report(db, incident_in, reported_by_user_id=current_user.id)

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    incident_type: Optional[str] = Query(None, description="Filter by type (LANDSLIDE, FLOOD, ROAD_DAMAGE, etc.)"),
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    verification_status: Optional[str] = Query(None, description="Filter by status (PENDING, VERIFIED, REJECTED)"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    db: Session = Depends(get_db)
):
    """
    Retrieve incident records with optional multi-attribute filtering.
    """
    query = db.query(Incident)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    if severity:
        query = query.filter(Incident.severity == severity)
    if verification_status:
        query = query.filter(Incident.verification_status == verification_status)
    if district:
        query = query.filter(Incident.district == district)

    return query.order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_by_id(incident_id: int, db: Session = Depends(get_db)):
    """
    Fetch complete details for a specific incident by ID.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
@router.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_incident_image(req: ImageAnalysisRequest):
    """
    Analyze field photograph using Computer Vision model to detect road damage patterns.
    """
    analysis = analyze_field_image(req.image_url)
    return ImageAnalysisResponse(**analysis)

@router.post("/upload-photo")
async def upload_and_analyze_field_photo(file: UploadFile = File(...)):
    """
    Upload a field photograph file (JPG/PNG) and analyze using OpenCV Computer Vision feature extraction.
    """
    contents = await file.read()
    analysis = analyze_field_image(contents)
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "analysis": analysis
    }
