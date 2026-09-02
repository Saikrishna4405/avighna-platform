from typing import Dict, List, Any
import numpy as np
from app.ml.risk_model import get_risk_model, road_condition_to_num

def predict_terrain_risk(
    latitude: float,
    longitude: float,
    rainfall: float,
    slope: float,
    elevation: float,
    road_condition: str,
    historical_incidents: int = 0,
    nearby_incidents: int = 0
) -> Dict[str, Any]:
    model = get_risk_model()
    cond_num = road_condition_to_num(road_condition)
    
    if model is not None:
        features = np.array([[rainfall, slope, elevation, cond_num, historical_incidents, nearby_incidents]])
        try:
            score = float(model.predict(features)[0])
        except Exception:
            score = calculate_heuristic_risk(rainfall, slope, cond_num, historical_incidents, nearby_incidents)
    else:
        score = calculate_heuristic_risk(rainfall, slope, cond_num, historical_incidents, nearby_incidents)

    score = round(max(0.0, min(100.0, score)), 1)
    
    # Categorize Risk Level
    if score <= 30.0:
        level = "LOW"
        action = "Standard monitoring. No immediate restriction required."
    elif score <= 50.0:
        level = "MODERATE"
        action = "Issue cautionary travel advisory for heavy cargo vehicles."
    elif score <= 70.0:
        level = "HIGH"
        action = "Alert regional authorities and request urgent field verification."
    else:
        level = "CRITICAL"
        action = "Immediate corridor restriction and emergency rerouting recommended."

    # Identify contributing reasons
    reasons = []
    if rainfall > 70.0:
        reasons.append(f"Heavy precipitation detected ({rainfall} mm/24h)")
    if slope > 30.0:
        reasons.append(f"Steep topographical gradient ({slope}° slope)")
    if road_condition.upper() in ["POOR", "CRITICAL"]:
        reasons.append(f"Degraded road infrastructure condition ({road_condition})")
    if historical_incidents >= 2:
        reasons.append(f"High historical vulnerability ({historical_incidents} past incidents)")
    if nearby_incidents > 0:
        reasons.append(f"Active nearby incident within 5km corridor radius")

    if not reasons:
        reasons.append("Normal terrain and environmental parameters observed.")

    return {
        "risk_score": score,
        "risk_level": level,
        "reasons": reasons,
        "recommended_action": action
    }

def calculate_heuristic_risk(rainfall: float, slope: float, cond_num: int, historical: int, nearby: int) -> float:
    base = (rainfall * 0.35) + (slope * 0.5) + (cond_num * 10) + (historical * 5) + (nearby * 8)
    return float(base)
