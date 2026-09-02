import sys
import os
import unittest

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.user import User
from app.models.road import Road
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.ml.prediction import predict_terrain_risk
from app.ml.image_analysis import analyze_field_image
from app.utils.routing_graph import find_best_routes
from app.utils.auth import get_password_hash, verify_password, create_access_token, decode_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_avighna.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestAvighnaCoreEngine(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_password_hashing_and_jwt(self):
        pwd = "password123"
        hashed = get_password_hash(pwd)
        self.assertTrue(verify_password(pwd, hashed))

        token = create_access_token({"sub": "admin@avighna.gov.in", "role": "ADMIN"})
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "admin@avighna.gov.in")
        self.assertEqual(payload["role"], "ADMIN")

    def test_ai_risk_prediction_engine(self):
        pred = predict_terrain_risk(
            latitude=25.90, longitude=91.80,
            rainfall=95.0, slope=38.0, elevation=1250.0,
            road_condition="POOR", historical_incidents=3, nearby_incidents=1
        )
        self.assertTrue(0 <= pred["risk_score"] <= 100)
        self.assertIn(pred["risk_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL"])
        self.assertTrue(len(pred["reasons"]) > 0)

    def test_computer_vision_analysis(self):
        cv = analyze_field_image("landslide_field_photo_01.jpg")
        self.assertEqual(cv["detected_condition"], "LANDSLIDE")
        self.assertEqual(cv["severity"], "CRITICAL")

    def test_routing_graph_algorithm(self):
        roads = [
            Road(id=1, road_name="NH-40 Guwahati-Shillong", road_code="NH-40",
                 start_lat=26.14, start_lon=91.73, end_lat=25.57, end_lon=91.88,
                 length_km=98.5, elevation=1450.0, slope=34.0, road_condition="GOOD",
                 accessibility_status="ACCESSIBLE", current_risk_score=15.0, geometry="[]"),
            Road(id=2, road_name="NH-27 Western Detour", road_code="NH-27",
                 start_lat=26.14, start_lon=91.73, end_lat=25.57, end_lon=91.88,
                 length_km=115.0, elevation=900.0, slope=12.0, road_condition="GOOD",
                 accessibility_status="ACCESSIBLE", current_risk_score=10.0, geometry="[]")
        ]
        primary, alts = find_best_routes(roads, "Guwahati", "Shillong")
        self.assertIsNotNone(primary)
        self.assertTrue(primary["distance_km"] > 0)
        self.assertTrue(primary["safety_score"] > 0)

if __name__ == "__main__":
    unittest.main()
