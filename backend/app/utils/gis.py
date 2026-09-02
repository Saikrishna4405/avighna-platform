import math
import json
from typing import Tuple, List, Dict, Any, Optional

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def find_nearest_road(lat: float, lon: float, db_session) -> Tuple[Optional[Any], float]:
    """
    Given a point (lat, lon), query database roads and return nearest road and distance in km.
    """
    from app.models.road import Road
    roads = db_session.query(Road).all()
    if not roads:
        return None, 999.9

    min_dist = float('inf')
    nearest = None

    for road in roads:
        # Distance to midpoint of segment
        mid_lat = (road.start_lat + road.end_lat) / 2.0
        mid_lon = (road.start_lon + road.end_lon) / 2.0
        dist = haversine_distance_km(lat, lon, mid_lat, mid_lon)
        if dist < min_dist:
            min_dist = dist
            nearest = road

    return nearest, round(min_dist, 2)

def to_geojson_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Wrap list of GeoJSON features into a standard GeoJSON FeatureCollection.
    """
    return {
        "type": "FeatureCollection",
        "features": features
    }
