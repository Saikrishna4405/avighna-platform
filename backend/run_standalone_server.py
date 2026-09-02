import http.server
import socketserver
import json
import sqlite3
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ml.prediction import predict_terrain_risk
from app.utils.routing_graph import find_best_routes

PORT = 8000
DB_PATH = os.path.join(os.path.dirname(__file__), "avighna.db")

def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class AvighnaHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _json_response(self, data, status_code=200):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        path = self.path.split('?')[0]
        conn = get_db_conn()
        cursor = conn.cursor()

        if path in ['/', '']:
            self._json_response({
                "status": "ONLINE",
                "system": "AVIGHNA - AI Smart Logistics Platform",
                "docs": "Standalone HTTP API Server"
            })
        elif path == '/api/dashboard/summary':
            c1 = cursor.execute("SELECT COUNT(*) FROM incidents WHERE verification_status != 'REJECTED'").fetchone()[0]
            c2 = cursor.execute("SELECT COUNT(*) FROM roads WHERE current_risk_score >= 50.0").fetchone()[0]
            c3 = cursor.execute("SELECT COUNT(*) FROM roads WHERE accessibility_status = 'BLOCKED'").fetchone()[0]
            c4 = cursor.execute("SELECT COUNT(*) FROM vehicles WHERE status = 'REROUTED'").fetchone()[0]
            c5 = cursor.execute("SELECT COUNT(*) FROM incidents WHERE verification_status = 'PENDING'").fetchone()[0]
            self._json_response({
                "active_incidents": c1,
                "high_risk_corridors": c2,
                "blocked_roads": c3,
                "vehicles_rerouted": c4,
                "pending_verifications": c5
            })
        elif path in ['/api/roads', '/api/map/roads', '/api/roads/accessibility']:
            rows = cursor.execute("SELECT * FROM roads").fetchall()
            features = []
            for r in rows:
                try: geom = json.loads(r['geometry'])
                except: geom = {"type": "LineString", "coordinates": [[r['start_lon'], r['start_lat']], [r['end_lon'], r['end_lat']]]}
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": {
                        "road_id": r['id'], "road_name": r['road_name'], "road_code": r['road_code'],
                        "accessibility_status": r['accessibility_status'], "risk_score": r['current_risk_score'],
                        "length_km": r['length_km'], "slope": r['slope']
                    }
                })
            self._json_response({"type": "FeatureCollection", "features": features})
        elif path in ['/api/incidents', '/api/map/incidents']:
            rows = cursor.execute("SELECT * FROM incidents ORDER BY id DESC").fetchall()
            items = [dict(r) for r in rows]
            self._json_response(items)
        elif path in ['/api/vehicles', '/api/map/vehicles']:
            rows = cursor.execute("SELECT * FROM vehicles").fetchall()
            items = [dict(r) for r in rows]
            self._json_response(items)
        elif path == '/api/alerts':
            rows = cursor.execute("SELECT * FROM alerts ORDER BY id DESC").fetchall()
            items = [dict(r) for r in rows]
            self._json_response(items)
        elif path == '/api/verifications/pending':
            rows = cursor.execute("SELECT * FROM incidents WHERE verification_status = 'PENDING'").fetchall()
            items = []
            for r in rows:
                items.append({
                    "id": r['id'], "incident_id": r['id'], "incident_type": r['incident_type'],
                    "severity": r['severity'], "description": r['description'],
                    "latitude": r['latitude'], "longitude": r['longitude'],
                    "photo_url": r['photo_url'], "ai_risk_score": r['risk_score'],
                    "ai_recommendation": r['ai_recommendation'], "created_at": r['created_at']
                })
            self._json_response(items)
        elif path == '/api/logistics/priorities':
            rows = cursor.execute("SELECT * FROM vehicles").fetchall()
            items = [dict(r) for r in rows]
            self._json_response(items)
        else:
            self._json_response({"detail": "Not Found"}, status_code=404)

        conn.close()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try: data = json.loads(body)
        except: data = {}

        path = self.path.split('?')[0]
        conn = get_db_conn()
        cursor = conn.cursor()

        if path == '/api/auth/login':
            self._json_response({
                "access_token": "demo_jwt_token_12345",
                "token_type": "bearer",
                "user": {"id": 1, "name": "System Admin", "email": data.get("email", "admin@avighna.gov.in"), "role": "ADMIN", "district": "Guwahati"}
            })
        elif path == '/api/risk/predict':
            res = predict_terrain_risk(
                latitude=data.get('latitude', 26.14),
                longitude=data.get('longitude', 91.73),
                rainfall=float(data.get('rainfall', 85.0)),
                slope=float(data.get('slope', 34.0)),
                elevation=float(data.get('elevation', 1200.0)),
                road_condition=data.get('road_condition', 'POOR'),
                historical_incidents=int(data.get('historical_incidents', 3))
            )
            self._json_response(res)
        elif path == '/api/incidents':
            cursor.execute(
                "INSERT INTO incidents (incident_type, severity, description, latitude, longitude, photo_url, verification_status, district, risk_score, ai_recommendation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
                (data.get('incident_type', 'LANDSLIDE'), data.get('severity', 'HIGH'), data.get('description', 'Field report'), data.get('latitude', 25.90), data.get('longitude', 91.80), data.get('photo_url', ''), 'PENDING', data.get('district', 'East Khasi Hills'), 72.0, 'Alert authorities; field verification requested.')
            )
            conn.commit()
            new_id = cursor.lastrowid
            self._json_response({"id": new_id, "status": "LOGGED", "risk_score": 72.0, "ai_recommendation": "Alert authorities; field verification requested."})
        elif path == '/api/routes/recommend':
            self._json_response({
                "recommended_route": {
                    "route_id": "r1", "route_name": "NH-40 Guwahati-Shillong Corridor", "distance_km": 98.5,
                    "eta": "2h 45m", "risk_score": 18.5, "safety_score": 81.5, "status": "RECOMMENDED",
                    "geometry": [[26.14, 91.73], [25.90, 91.80], [25.57, 91.88]]
                },
                "alternative_routes": [
                  {
                    "route_id": "r2", "route_name": "NH-27 Southern Alternate Detour", "distance_km": 118.0,
                    "eta": "3h 15m", "risk_score": 12.0, "safety_score": 88.0, "status": "ALTERNATIVE",
                    "geometry": [[26.14, 91.73], [26.05, 91.50], [25.57, 91.88]]
                  }
                ],
                "distance_km": 98.5, "eta": "2h 45m", "risk_score": 18.5, "safety_score": 81.5,
                "reason_for_selection": "Selected route balances distance with high safety score avoiding active landslide zones."
            })
        elif path == '/api/demo/run-scenario':
            cursor.execute("UPDATE roads SET accessibility_status = 'BLOCKED', current_risk_score = 92.0 WHERE id = 1")
            cursor.execute("UPDATE vehicles SET status = 'REROUTED', eta = '3h 15m', current_route = ? WHERE id = 1", (json.dumps([[26.14, 91.73], [26.05, 91.50], [25.57, 91.88]]),))
            conn.commit()
            self._json_response({
                "status": "SUCCESS",
                "message": "Interactive Demo Scenario executed.",
                "execution_steps": [
                    {"step": 1, "title": "Heavy Monsoon Precipitation Detected (95mm)", "detail": "Weather sensor detected heavy rain in East Khasi Hills.", "status": "COMPLETED"},
                    {"step": 2, "title": "AI Risk Prediction: 72/100 (HIGH)", "detail": "ML Model evaluated slope & rain. Issued HIGH-RISK alert.", "status": "COMPLETED"},
                    {"step": 3, "title": "Field Verification Confirmed -> ROAD BLOCKED", "detail": "Guwahati-Shillong corridor set to BLOCKED.", "status": "COMPLETED"},
                    {"step": 4, "title": "Vehicle AS-01-EV-1024 Auto Rerouted", "detail": "Rerouted to NH-27 Detour. New ETA: 3h 15m.", "status": "COMPLETED"},
                    {"step": 5, "title": "Dashboard KPIs Updated", "detail": "Blocked Roads: 2 | Rerouted Vehicles: 1.", "status": "COMPLETED"}
                ]
            })
        elif path == '/api/verifications':
            inc_id = data.get('incident_id', 1)
            dec = data.get('decision', 'VERIFIED')
            cursor.execute("UPDATE incidents SET verification_status = ? WHERE id = ?", (dec, inc_id))
            if dec == 'VERIFIED':
                cursor.execute("UPDATE roads SET accessibility_status = 'BLOCKED', current_risk_score = 90.0 WHERE id = 1")
                cursor.execute("UPDATE vehicles SET status = 'REROUTED' WHERE id = 1")
            conn.commit()
            self._json_response({"id": 1, "incident_id": inc_id, "decision": dec, "remarks": data.get("remarks", "Verified")})
        else:
            self._json_response({"status": "SUCCESS"})

        conn.close()

if __name__ == '__main__':
    server = socketserver.TCPServer(('0.0.0.0', PORT), AvighnaHTTPRequestHandler)
    print(f"AVIGHNA Standalone API Server running on port {PORT}...")
    server.serve_forever()
