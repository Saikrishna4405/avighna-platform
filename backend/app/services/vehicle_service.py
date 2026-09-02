import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.road import Road
from app.utils.routing_graph import find_best_routes
from app.services.alert_service import create_system_alert

def update_vehicle_gps_location(db: Session, vehicle_id: int, lat: float, lon: float, status: Optional[str] = None) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise ValueError("Vehicle not found")

    vehicle.latitude = lat
    vehicle.longitude = lon
    if status:
        vehicle.status = status

    db.commit()
    db.refresh(vehicle)
    return vehicle

def trigger_vehicle_rerouting(
    db: Session,
    vehicle_id: int,
    avoid_road_id: Optional[int] = None,
    reason: str = "Corridor became blocked / CRITICAL risk"
) -> Dict[str, Any]:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise ValueError(f"Vehicle with ID {vehicle_id} not found")

    roads = db.query(Road).all()
    avoid_list = [avoid_road_id] if avoid_road_id else []

    # If vehicle has assigned roads, extract them
    if not avoid_list and vehicle.assigned_road_ids:
        try:
            avoid_list = [int(r.strip()) for r in vehicle.assigned_road_ids.split(",") if r.strip()]
        except Exception:
            pass

    old_eta = vehicle.eta or "3h 40m"
    old_route_str = vehicle.current_route or "NH-37 Direct Highway Corridor"

    # Compute alternate safe route
    primary, alts = find_best_routes(
        roads=roads,
        origin_name=vehicle.origin or "Guwahati",
        destination_name=vehicle.destination or "Shillong",
        vehicle_type=vehicle.vehicle_type,
        priority=vehicle.priority,
        avoid_road_ids=avoid_list
    )

    best_alt = alts[0] if alts else primary

    # Update Vehicle Record
    vehicle.status = "REROUTED"
    vehicle.eta = best_alt["eta"]
    vehicle.current_route = json.dumps(best_alt["geometry"])
    db.commit()
    db.refresh(vehicle)

    # Generate REROUTE alert
    create_system_alert(
        db=db,
        alert_type="VEHICLE_REROUTED",
        severity="HIGH",
        message=f"Vehicle {vehicle.vehicle_number} ({vehicle.cargo_type}) automatically rerouted to {best_alt['route_name']}. New ETA: {best_alt['eta']}. Reason: {reason}",
        latitude=vehicle.latitude,
        longitude=vehicle.longitude,
        vehicle_id=vehicle.id
    )

    return {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "old_route": old_route_str,
        "new_route": best_alt["route_name"],
        "old_eta": old_eta,
        "new_eta": best_alt["eta"],
        "reason": reason,
        "safety_score": best_alt["safety_score"]
    }

def auto_reroute_vehicles_on_corridor(db: Session, road_id: int, reason: str) -> List[Dict[str, Any]]:
    """
    Scans all active vehicles and reroutes any vehicle using the specified road corridor.
    """
    vehicles = db.query(Vehicle).filter(Vehicle.status.in_(["ACTIVE", "DELAYED"])).all()
    rerouted_results = []

    for v in vehicles:
        # If vehicle's assigned roads include this road or affects route
        should_reroute = False
        if v.assigned_road_ids:
            road_ids = [r.strip() for r in v.assigned_road_ids.split(",")]
            if str(road_id) in road_ids:
                should_reroute = True
        else:
            # Default for demo scenario: reroute emergency supply vehicles travelling on affected sector
            should_reroute = True

        if should_reroute:
            res = trigger_vehicle_rerouting(db, v.id, avoid_road_id=road_id, reason=reason)
            rerouted_results.append(res)

    return rerouted_results
