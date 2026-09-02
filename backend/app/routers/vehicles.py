import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleCreate, VehicleResponse, VehicleLocationUpdate, 
    VehicleRerouteRequest, RerouteResponse
)
from app.services.vehicle_service import update_vehicle_gps_location, trigger_vehicle_rerouting
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/vehicles", tags=["Vehicle Tracking & Fleet Rerouting"])

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle_in: VehicleCreate, db: Session = Depends(get_db)):
    """
    Register a logistics vehicle into the fleet tracking system.
    """
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_in.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already registered.")

    vehicle = Vehicle(
        vehicle_number=vehicle_in.vehicle_number,
        vehicle_type=vehicle_in.vehicle_type,
        latitude=vehicle_in.latitude,
        longitude=vehicle_in.longitude,
        origin=vehicle_in.origin,
        destination=vehicle_in.destination,
        status="ACTIVE",
        priority=vehicle_in.priority,
        cargo_type=vehicle_in.cargo_type,
        eta="3h 30m"
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    """
    Retrieve all registered vehicles and their live status.
    """
    return db.query(Vehicle).all()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Get detailed tracking metrics for a specific vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}/location", response_model=VehicleResponse)
def update_location(vehicle_id: int, loc: VehicleLocationUpdate, db: Session = Depends(get_db)):
    """
    Update live GPS coordinates and operational status for a vehicle.
    """
    try:
        return update_vehicle_gps_location(db, vehicle_id, loc.latitude, loc.longitude, loc.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{vehicle_id}/reroute", response_model=RerouteResponse)
def reroute_vehicle(
    vehicle_id: int,
    req: VehicleRerouteRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger real-time automatic rerouting for a vehicle to bypass hazardous or blocked corridors.
    """
    try:
        res = trigger_vehicle_rerouting(db, vehicle_id, req.avoid_road_id, req.reason)
        return RerouteResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/simulate-step")
def simulate_gps_movement(db: Session = Depends(get_db)):
    """
    DEMO GPS Simulator: Advances active vehicles along their designated route coordinates.
    """
    vehicles = db.query(Vehicle).filter(Vehicle.status.in_(["ACTIVE", "REROUTED"])).all()
    updated_count = 0

    for v in vehicles:
        # Move coordinates slightly toward destination
        v.latitude += 0.008
        v.longitude += 0.005
        updated_count += 1

    db.commit()
    return {"status": "SUCCESS", "message": f"Simulated GPS movement for {updated_count} active vehicles."}
