import json
from typing import List, Dict, Any, Tuple
from app.utils.gis import haversine_distance_km

try:
    import networkx as nx
    USE_NETWORKX = True
except ImportError:
    USE_NETWORKX = False

def build_road_graph(roads: list, avoid_road_ids: List[int] = None):
    if not USE_NETWORKX:
        return None

    avoid_set = set(avoid_road_ids or [])
    G = nx.Graph()

    for road in roads:
        is_blocked = (road.accessibility_status == "BLOCKED" or road.id in avoid_set)
        
        u = f"{road.road_name.split()[0]}_Start"
        v = f"{road.road_name.split()[0]}_End"

        dist = road.length_km if road.length_km > 0 else 10.0
        risk = road.current_risk_score if not is_blocked else 100.0
        
        if is_blocked:
            weight = 999999.0
        else:
            weight = (dist * 1.0) + (risk * 2.5) + (road.slope * 0.5)

        G.add_edge(
            u, v,
            road_id=road.id,
            road_name=road.road_name,
            road_code=road.road_code,
            distance_km=dist,
            risk_score=risk,
            accessibility_status=road.accessibility_status,
            start_coords=(road.start_lat, road.start_lon),
            end_coords=(road.end_lat, road.end_lon),
            geometry=road.geometry,
            weight=weight
        )

    return G

def find_best_routes(
    roads: list,
    origin_name: str,
    destination_name: str,
    vehicle_type: str = "ESSENTIAL_SUPPLY",
    priority: str = "HIGH",
    avoid_road_ids: List[int] = None
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    if USE_NETWORKX:
        G = build_road_graph(roads, avoid_road_ids=avoid_road_ids)
        if G is not None:
            nodes = list(G.nodes)
            if nodes:
                orig_node = next((n for n in nodes if origin_name.lower() in n.lower()), nodes[0])
                dest_node = next((n for n in nodes if destination_name.lower() in n.lower()), nodes[-1] if len(nodes)>1 else nodes[0])

                try:
                    path = nx.shortest_path(G, source=orig_node, target=dest_node, weight="weight")
                    primary_route = _format_path_to_route_dict(G, path, "Route 1 (Recommended Safety Corridor)", primary=True)

                    alt_routes = []
                    try:
                        simple_paths = list(nx.all_simple_paths(G, source=orig_node, target=dest_node, cutoff=6))
                        count = 2
                        for alt_path in simple_paths[1:3]:
                            alt = _format_path_to_route_dict(G, alt_path, f"Route {count} (Alternative By-Pass)", primary=False)
                            alt_routes.append(alt)
                            count += 1
                    except Exception:
                        pass

                    if not alt_routes:
                        alt_routes.append(_synthetic_alt_route(primary_route))

                    return primary_route, alt_routes
                except Exception:
                    pass

    return _dummy_fallback_route(origin_name, destination_name)

def _format_path_to_route_dict(G, path: list, route_name: str, primary: bool = False) -> Dict[str, Any]:
    total_dist = 0.0
    total_risk = 0.0
    geometry_points = []
    edges_count = 0

    for i in range(len(path) - 1):
        u, v = path[i], path[i+1]
        edge_data = G[u][v]
        total_dist += edge_data.get("distance_km", 10.0)
        total_risk += edge_data.get("risk_score", 15.0)
        edges_count += 1
        
        start_c = edge_data.get("start_coords", (26.14, 91.73))
        end_c = edge_data.get("end_coords", (27.47, 94.91))
        geometry_points.append([start_c[0], start_c[1]])
        geometry_points.append([end_c[0], end_c[1]])

    avg_risk = round(total_risk / max(1, edges_count), 1)
    safety_score = round(max(0.0, 100.0 - avg_risk), 1)
    
    hours = total_dist / 40.0
    h = int(hours)
    m = int((hours - h) * 60)
    eta_str = f"{h}h {m}m"

    return {
        "route_id": f"route_{hash(route_name) % 10000}",
        "route_name": route_name,
        "distance_km": round(total_dist, 1),
        "eta": eta_str,
        "risk_score": avg_risk,
        "safety_score": safety_score,
        "geometry": geometry_points if geometry_points else [[26.14, 91.73], [25.57, 91.88]],
        "status": "RECOMMENDED" if primary else "ALTERNATIVE"
    }

def _synthetic_alt_route(primary: Dict[str, Any]) -> Dict[str, Any]:
    alt_dist = round(primary["distance_km"] * 1.12, 1)
    alt_risk = round(max(10.0, primary["risk_score"] - 25.0), 1)
    hours = alt_dist / 38.0
    h = int(hours)
    m = int((hours - h) * 60)
    
    coords = [[p[0] + 0.05, p[1] - 0.04] for p in primary["geometry"]]

    return {
        "route_id": f"route_alt_{hash(primary['route_name']) % 1000}",
        "route_name": "NH-27 Southern Alternate Detour",
        "distance_km": alt_dist,
        "eta": f"{h}h {m}m",
        "risk_score": alt_risk,
        "safety_score": round(100.0 - alt_risk, 1),
        "geometry": coords,
        "status": "ALTERNATIVE"
    }

CITY_COORDS = {
    "guwahati": (26.1445, 91.7362),
    "shillong": (25.5788, 91.8933),
    "silchar": (24.8333, 92.7789),
    "kohima": (25.6747, 94.1100),
    "dimapur": (25.9060, 93.7270),
    "itanagar": (27.0844, 93.6053),
    "imphal": (24.8170, 93.9368),
    "aizawl": (23.7307, 92.7173),
    "gangtok": (27.3389, 88.6065),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "bengaluru": (12.9716, 77.5946),
    "kolkata": (22.5726, 88.3639)
}

def _get_coords_for_name(name: str, default_lat: float, default_lon: float) -> Tuple[float, float]:
    name_clean = str(name).lower().strip()
    for k, coords in CITY_COORDS.items():
        if k in name_clean:
            return coords
    return (default_lat, default_lon)

def _dummy_fallback_route(orig: str, dest: str, orig_lat: float = None, orig_lon: float = None, dest_lat: float = None, dest_lon: float = None) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    o_lat, o_lon = (orig_lat, orig_lon) if (orig_lat and orig_lon) else _get_coords_for_name(orig, 26.1445, 91.7362)
    d_lat, d_lon = (dest_lat, dest_lon) if (dest_lat and dest_lon) else _get_coords_for_name(dest, 25.5788, 91.8933)

    direct_dist = haversine_distance_km(o_lat, o_lon, d_lat, d_lon)
    dist_km = round(max(2.0, direct_dist * 1.3), 1)
    alt_dist = round(dist_km * 1.18, 1)

    speed = 50.0
    hours = dist_km / speed
    h = int(hours)
    m = int((hours - h) * 60)
    eta_str = f"{h}h {m}m" if h > 0 else f"{m} mins"

    alt_hours = alt_dist / (speed * 0.85)
    ah = int(alt_hours)
    am = int((alt_hours - ah) * 60)
    alt_eta_str = f"{ah}h {am}m" if ah > 0 else f"{am} mins"

    risk = round(min(65.0, 12.0 + (dist_km * 0.05)), 1)
    safety = round(100.0 - risk, 1)

    mid_lat = (o_lat + d_lat) / 2.0 + 0.05
    mid_lon = (o_lon + d_lon) / 2.0 - 0.05

    alt_mid_lat = (o_lat + d_lat) / 2.0 - 0.08
    alt_mid_lon = (o_lon + d_lon) / 2.0 + 0.08

    p = {
        "route_id": f"route_primary_{abs(hash(orig + dest)) % 10000}",
        "route_name": f"Highway Corridor ({orig} to {dest})",
        "distance_km": dist_km,
        "eta": eta_str,
        "risk_score": risk,
        "safety_score": safety,
        "geometry": [[o_lat, o_lon], [mid_lat, mid_lon], [d_lat, d_lon]],
        "status": "RECOMMENDED"
    }
    alt = {
        "route_id": f"route_alt_{abs(hash(orig + dest + 'alt')) % 10000}",
        "route_name": f"Alternate Bypass ({orig} to {dest} Detour)",
        "distance_km": alt_dist,
        "eta": alt_eta_str,
        "risk_score": round(risk * 0.7, 1),
        "safety_score": round(100.0 - (risk * 0.7), 1),
        "geometry": [[o_lat, o_lon], [alt_mid_lat, alt_mid_lon], [d_lat, d_lon]],
        "status": "ALTERNATIVE"
    }
    return p, [alt]
