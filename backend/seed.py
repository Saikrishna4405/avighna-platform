import sys
import os
import json
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.road import Road
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.models.alert import Alert
from app.models.verification import Verification
from app.models.weather import Weather
from app.utils.auth import get_password_hash
from app.ml.train_model import train_and_save_model

def seed_database():
    print("--------------------------------------------------")
    print("AVIGHNA - Seeding North Eastern Region Demo Data")
    print("--------------------------------------------------")

    # 1. Train ML model if not built
    ml_models_dir = os.path.join(os.path.dirname(__file__), "..", "ml_models")
    train_and_save_model(model_dir=ml_models_dir)

    # 2. Reset database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # A. USERS
        print("Seeding Users (5 System Roles)...")
        hashed_pwd = get_password_hash("password123")
        
        users = [
            User(name="System Admin", email="admin@avighna.gov.in", password_hash=hashed_pwd, role="ADMIN", district="Guwahati Central"),
            User(name="Field Officer Rahul Sharma", email="field@avighna.gov.in", password_hash=hashed_pwd, role="FIELD_OFFICER", district="East Khasi Hills"),
            User(name="Verifier Inspector Biren Das", email="verifier@avighna.gov.in", password_hash=hashed_pwd, role="VERIFIER", district="Shillong Sector"),
            User(name="Planner Ananya Roy", email="planner@avighna.gov.in", password_hash=hashed_pwd, role="DISTRICT_PLANNER", district="Kamrup Metro"),
            User(name="Logistics Ops Officer Mark", email="logistics@avighna.gov.in", password_hash=hashed_pwd, role="LOGISTICS_OPERATOR", district="NER Transport Hub")
        ]
        db.add_all(users)
        db.commit()

        # B. ROADS (NER Corridors)
        print("Seeding Strategic NER Road Corridors...")
        roads = [
            Road(
                road_name="Guwahati-Shillong Highway Corridor",
                road_code="NH-40-GS",
                geometry=json.dumps({"type": "LineString", "coordinates": [[91.73, 26.14], [91.80, 25.90], [91.88, 25.57]]}),
                start_lat=26.14, start_lon=91.73, end_lat=25.57, end_lon=91.88,
                length_km=98.5, elevation=1450.0, slope=34.0, road_condition="POOR",
                accessibility_status="RISKY", current_risk_score=68.5, district="East Khasi Hills"
            ),
            Road(
                road_name="Shillong-Silchar Mountain Highway",
                road_code="NH-06-SS",
                geometry=json.dumps({"type": "LineString", "coordinates": [[91.88, 25.57], [92.20, 25.40], [92.80, 24.83]]}),
                start_lat=25.57, start_lon=91.88, end_lat=24.83, end_lon=92.80,
                length_km=210.0, elevation=1200.0, slope=42.0, road_condition="POOR",
                accessibility_status="RISKY", current_risk_score=74.0, district="Jaintia Hills"
            ),
            Road(
                road_name="Guwahati-Tezpur Brahmaputra Expressway",
                road_code="NH-27-GT",
                geometry=json.dumps({"type": "LineString", "coordinates": [[91.73, 26.14], [92.20, 26.30], [92.80, 26.63]]}),
                start_lat=26.14, start_lon=91.73, end_lat=26.63, end_lon=92.80,
                length_km=178.0, elevation=120.0, slope=6.0, road_condition="GOOD",
                accessibility_status="ACCESSIBLE", current_risk_score=18.0, district="Sonitpur"
            ),
            Road(
                road_name="Dimapur-Kohima Mountain Pass",
                road_code="NH-29-DK",
                geometry=json.dumps({"type": "LineString", "coordinates": [[93.72, 25.90], [94.10, 25.67]]}),
                start_lat=25.90, start_lon=93.72, end_lat=25.67, end_lon=94.10,
                length_km=74.0, elevation=1440.0, slope=38.0, road_condition="CRITICAL",
                accessibility_status="BLOCKED", current_risk_score=88.0, district="Kohima"
            ),
            Road(
                road_name="Tezpur-Itanagar Capital Corridor",
                road_code="NH-415-TI",
                geometry=json.dumps({"type": "LineString", "coordinates": [[92.80, 26.63], [93.62, 27.10]]}),
                start_lat=26.63, start_lon=92.80, end_lat=27.10, end_lon=93.62,
                length_km=155.0, elevation=750.0, slope=22.0, road_condition="FAIR",
                accessibility_status="ACCESSIBLE", current_risk_score=32.0, district="Papum Pare"
            )
        ]
        db.add_all(roads)
        db.commit()

        # C. INCIDENTS
        print("Seeding Field Incidents...")
        incidents = [
            Incident(
                incident_type="LANDSLIDE", severity="HIGH",
                description="Massive mudslide triggered by heavy precipitation near Nongpoh sector.",
                latitude=25.90, longitude=91.80,
                geometry=json.dumps({"type": "Point", "coordinates": [91.80, 25.90]}),
                photo_url="landslide_field_photo_01.jpg", reported_by=2, road_id=1,
                verification_status="PENDING", district="East Khasi Hills", risk_score=72.0,
                ai_recommendation="Alert transport authorities; field verification requested."
            ),
            Incident(
                incident_type="FLOOD", severity="CRITICAL",
                description="Barak river overflowing causing severe waterlogging on valley bypass road.",
                latitude=24.83, longitude=92.80,
                geometry=json.dumps({"type": "Point", "coordinates": [92.80, 24.83]}),
                photo_url="flood_warning_photo_02.jpg", reported_by=2, road_id=2,
                verification_status="VERIFIED", district="Cachar", risk_score=84.0,
                ai_recommendation="Corridor blocked. Reroute essential goods vehicles immediately."
            )
        ]
        db.add_all(incidents)
        db.commit()

        # D. VEHICLES (Fleet tracking)
        print("Seeding Active Fleet Vehicles...")
        vehicles = [
            Vehicle(
                vehicle_number="AS-01-EV-1024", vehicle_type="ESSENTIAL_SUPPLY",
                latitude=26.10, longitude=91.75, origin="Guwahati", destination="Shillong",
                status="ACTIVE", priority="CRITICAL", cargo_type="Emergency Oxygen & Medical Supplies",
                current_route=json.dumps([[26.14, 91.73], [25.90, 91.80], [25.57, 91.88]]),
                assigned_road_ids="1,2", eta="2h 45m"
            ),
            Vehicle(
                vehicle_number="ML-05-LOG-8820", vehicle_type="FOOD_SUPPLY",
                latitude=25.75, longitude=91.82, origin="Guwahati", destination="Silchar",
                status="ACTIVE", priority="HIGH", cargo_type="Ration Grains & Packed Provisions",
                current_route=json.dumps([[26.14, 91.73], [25.57, 91.88], [24.83, 92.80]]),
                assigned_road_ids="1,2", eta="5h 15m"
            ),
            Vehicle(
                vehicle_number="NL-01-TRK-3341", vehicle_type="REGULAR_CARGO",
                latitude=25.90, longitude=93.72, origin="Dimapur", destination="Kohima",
                status="STOPPED", priority="NORMAL", cargo_type="Construction Materials",
                current_route=json.dumps([[25.90, 93.72], [25.67, 94.10]]),
                assigned_road_ids="4", eta="BLOCKED"
            )
        ]
        db.add_all(vehicles)
        db.commit()

        # E. ALERTS & VERIFICATIONS
        print("Seeding System Warnings & Verification Requests...")
        alerts = [
            Alert(
                alert_type="LANDSLIDE_RISK", severity="HIGH",
                message="High landslide risk (72/100) detected on Guwahati-Shillong Highway near Nongpoh.",
                latitude=25.90, longitude=91.80, corridor_id=1, status="ACTIVE"
            ),
            Alert(
                alert_type="ROAD_BLOCKED", severity="CRITICAL",
                message="Dimapur-Kohima Pass confirmed BLOCKED due to severe slope failure.",
                latitude=25.67, longitude=94.10, corridor_id=4, status="ACTIVE"
            )
        ]
        db.add_all(alerts)

        verifications = [
            Verification(
                incident_id=2, verifier_id=3, decision="VERIFIED",
                remarks="Sub-divisional magistrate verified 1.2m water depth over highway."
            )
        ]
        db.add_all(verifications)

        # F. WEATHER
        print("Seeding Meteorological Records...")
        weather_records = [
            Weather(latitude=25.57, longitude=91.88, location_name="Shillong Sector", rainfall_mm=95.0, rainfall_intensity="HEAVY", temperature=18.5, forecast_risk="HIGH"),
            Weather(latitude=26.14, longitude=91.73, location_name="Guwahati Metro", rainfall_mm=32.0, rainfall_intensity="MODERATE", temperature=27.0, forecast_risk="LOW"),
            Weather(latitude=24.83, longitude=92.80, location_name="Silchar Valley", rainfall_mm=112.0, rainfall_intensity="EXTREME", temperature=25.5, forecast_risk="CRITICAL")
        ]
        db.add_all(weather_records)

        db.commit()

        print("--------------------------------------------------")
        print("AVIGHNA Database Seeded Successfully!")
        print("Credentials for demo testing:")
        print("  ADMIN:              admin@avighna.gov.in / password123")
        print("  FIELD OFFICER:      field@avighna.gov.in / password123")
        print("  VERIFIER:           verifier@avighna.gov.in / password123")
        print("  DISTRICT PLANNER:   planner@avighna.gov.in / password123")
        print("  LOGISTICS OPERATOR: logistics@avighna.gov.in / password123")
        print("--------------------------------------------------")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
