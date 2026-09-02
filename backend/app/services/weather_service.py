import os
import requests
from typing import Dict, Any
from app.config import settings

def get_current_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch weather information for a specific coordinate in NER.
    Uses WEATHER_API_KEY if available; falls back to realistic DEMO weather simulation.
    """
    api_key = settings.WEATHER_API_KEY
    if api_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                rain_mm = data.get("rain", {}).get("1h", 0.0) * 24.0 # estimate 24h
                temp = data.get("main", {}).get("temp", 24.0)
                
                intensity = "LIGHT"
                if rain_mm > 100: intensity = "EXTREME"
                elif rain_mm > 50: intensity = "HEAVY"
                elif rain_mm > 15: intensity = "MODERATE"

                return {
                    "latitude": latitude,
                    "longitude": longitude,
                    "location_name": data.get("name", "NER Region"),
                    "rainfall_mm": round(rain_mm, 1),
                    "rainfall_intensity": intensity,
                    "temperature": round(temp, 1),
                    "forecast_risk": "HIGH" if intensity in ["HEAVY", "EXTREME"] else "LOW",
                    "source": "REAL_EXTERNAL_API"
                }
        except Exception as e:
            print(f"Weather API request failed: {e}. Falling back to NER DEMO engine.")

    # DEMO Fallback generator based on NER coordinate zones
    return generate_demo_weather(latitude, longitude)

def generate_demo_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Realistic demo weather generator reflecting heavy monsoon conditions in Meghalaya/Assam/Arunachal.
    """
    # Cherrapunji / Shillong region (lat 25.2 - 25.6, lon 91.5 - 92.0) experiences heavy rainfall
    if 25.0 <= latitude <= 26.0 and 91.0 <= longitude <= 92.5:
        rainfall = 92.5  # Heavy monsoon rainfall
        intensity = "HEAVY"
        temp = 19.5
        risk = "HIGH"
        loc = "East Khasi Hills (Shillong Sector)"
    elif 26.0 <= latitude <= 27.5 and 91.0 <= longitude <= 93.0:
        rainfall = 45.0
        intensity = "MODERATE"
        temp = 26.0
        risk = "MODERATE"
        loc = "Kamrup Corridor (Guwahati-Tezpur)"
    else:
        rainfall = 18.0
        intensity = "LIGHT"
        temp = 22.0
        risk = "LOW"
        loc = "NER Foothills Corridor"

    return {
        "latitude": latitude,
        "longitude": longitude,
        "location_name": loc,
        "rainfall_mm": rainfall,
        "rainfall_intensity": intensity,
        "temperature": temp,
        "forecast_risk": risk,
        "source": "DEMO_NER_WEATHER_ENGINE"
    }

def get_forecast(latitude: float, longitude: float) -> Dict[str, Any]:
    current = get_current_weather(latitude, longitude)
    return {
        "current": current,
        "forecast_24h_rainfall_mm": round(current["rainfall_mm"] * 1.25, 1),
        "landslide_trigger_warning": current["rainfall_mm"] > 75.0
    }
