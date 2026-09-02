# AVIGHNA: AI-Powered Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)

---

## 1. Project Purpose & Architecture

The North Eastern Region (NER) of India regularly experiences extreme weather, steep terrain, landslides, flash floods, and sudden road infrastructure failures. **AVIGHNA** shifts disaster logistics decision-making from **REACTIVE RESPONSE** to **EARLY DETECTION → RISK PREDICTION → SMART DECISION → ACTION** through a 4-stage pipeline:

```
SENSE → COMPREHEND → FORECAST → ACT
```

* **SENSE**: Collects precipitation data, GPS vehicle tracking, terrain slope/elevation, field reports, and geo-tagged photos.
* **COMPREHEND**: Processes hazard incidents, computes nearest corridor matching, and evaluates terrain vulnerability.
* **FORECAST**: Executes Machine Learning models (Random Forest) predicting landslide, flood, and road failure risks (0–100 score).
* **ACT**: Generates automated alerts, triggers human verification workflows, updates GeoJSON road accessibility, recalculates optimal detours via graph engine, and automatically reroutes emergency cargo vehicles.

---

## 2. Project Directory Structure

```
sih/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application & router initialization
│   │   ├── config.py               # Pydantic BaseSettings config
│   │   ├── database.py             # SQLAlchemy engine & session maker
│   │   ├── dependencies.py         # OAuth2 JWT & Role-Based Access Control (RBAC)
│   │   ├── models/                 # ORM Database Models (User, Incident, Road, Vehicle, Route, Alert, Verification, Weather)
│   │   ├── schemas/                # Pydantic Request & Response schemas
│   │   ├── routers/                # REST API Endpoint Controllers (auth, incidents, roads, vehicles, routes, risk, alerts, etc.)
│   │   ├── services/               # Core Domain Services (risk_service, route_service, vehicle_service, accessibility_service, etc.)
│   │   ├── ml/                     # Machine Learning Modules (risk_model.py, train_model.py, prediction.py, image_analysis.py)
│   │   └── utils/                  # GIS spatial math & NetworkX graph router
│   ├── tests/                      # Pytest automated test suite
│   ├── seed.py                     # Realistic NER seed data population script
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Backend container specification
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI Components (Navbar, Sidebar, MapView, RiskBadge, StatCard, DemoModal)
│   │   ├── pages/                  # 10 Full App Views (Dashboard, LiveMap, Incidents, RiskAnalysis, Vehicles, Routes, Alerts, Verification, LogisticsPriority, Login)
│   │   ├── services/               # REST API fetch client & offline queue storage manager
│   │   ├── i18n/                   # Multilingual translation dictionary (en.json)
│   │   ├── App.jsx                 # Main React router & layout
│   │   └── App.css                 # Operational Intelligence UI Design System
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── ml_models/                      # Serialized Joblib ML Risk Models (risk_model.joblib)
├── docker-compose.yml              # PostGIS + Backend + Frontend multi-container orchestrator
├── .env.example                    # Environment variable template
└── README.md                       # Comprehensive Documentation
```

---

## 3. Technology Stack

* **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Python-JWT, Passlib (Bcrypt).
* **Database**: PostgreSQL 15 + PostGIS (with automatic spatial SQLite fallback for local developer machines).
* **AI/ML & CV**: Scikit-Learn (RandomForestRegressor), NumPy, pandas, Joblib, OpenCV image analysis heuristics.
* **Graph Routing**: NetworkX graph engine with multi-criteria Dijkstra cost function.
* **Frontend**: React 18, Vite, Leaflet & React-Leaflet, Lucide Icons, Glassmorphism Dark CSS.
* **Deployment**: Docker & Docker Compose.

---

## 4. Database Schema

1. **USERS**: `id`, `name`, `email`, `password_hash`, `role` (`ADMIN`, `FIELD_OFFICER`, `VERIFIER`, `DISTRICT_PLANNER`, `LOGISTICS_OPERATOR`), `district`, `created_at`.
2. **INCIDENTS**: `id`, `incident_type` (`LANDSLIDE`, `FLOOD`, `ROAD_DAMAGE`, `ROAD_BLOCKED`, `DEBRIS`, `BRIDGE_DAMAGE`, `OTHER`), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `description`, `latitude`, `longitude`, `geometry`, `photo_url`, `reported_by`, `road_id`, `verification_status` (`PENDING`, `VERIFIED`, `REJECTED`), `district`, `risk_score`, `ai_recommendation`, `created_at`.
3. **ROADS**: `id`, `road_name`, `road_code`, `geometry` (GeoJSON), `start_lat`, `start_lon`, `end_lat`, `end_lon`, `length_km`, `elevation`, `slope`, `road_condition` (`GOOD`, `FAIR`, `POOR`, `CRITICAL`), `accessibility_status` (`ACCESSIBLE`, `RISKY`, `BLOCKED`), `current_risk_score`, `district`.
4. **VEHICLES**: `id`, `vehicle_number`, `vehicle_type` (`ESSENTIAL_SUPPLY`, `MEDICAL`, `FOOD`, `CARGO`), `latitude`, `longitude`, `origin`, `destination`, `status` (`ACTIVE`, `DELAYED`, `REROUTED`, `STOPPED`, `COMPLETED`), `current_route`, `eta`, `priority` (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`), `cargo_type`.
5. **ROUTES**: `id`, `origin`, `destination`, `geometry`, `distance_km`, `estimated_time`, `safety_score`, `risk_score`, `logistics_priority`.
6. **ALERTS**: `id`, `alert_type`, `severity`, `message`, `latitude`, `longitude`, `corridor_id`, `status` (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`).
7. **VERIFICATIONS**: `id`, `incident_id`, `verifier_id`, `decision` (`VERIFIED`, `REJECTED`), `remarks`, `verified_at`.
8. **WEATHER**: `id`, `latitude`, `longitude`, `location_name`, `rainfall_mm`, `rainfall_intensity`, `temperature`, `forecast_risk`.

---

## 5. API Endpoints Summary

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Register user with role.
* `POST /api/auth/login` - Authenticate & retrieve JWT bearer token.
* `GET /api/auth/me` - Fetch profile of logged-in user.

### Incidents & Image Analysis (`/api/incidents`)
* `POST /api/incidents` - Report new field incident; runs nearest road match & AI risk calculation.
* `GET /api/incidents` - List incidents with type/severity/district filters.
* `POST /api/incidents/analyze-image` - Computer vision hazard classification on photo uploads.

### Roads & GIS Accessibility (`/api/roads` & `/api/map`)
* `GET /api/roads` - List road network corridors.
* `GET /api/roads/accessibility` - Stream standard GeoJSON FeatureCollection of roads colored by status.
* `GET /api/map/roads`, `/incidents`, `/vehicles`, `/alerts` - GeoJSON map streams for Leaflet.

### AI Risk Prediction (`/api/risk`)
* `POST /api/risk/predict` - Input precipitation, slope, elevation, condition -> Returns risk score (0-100), level, reasons, and actions.

### Route Recommendation & Vehicle Rerouting (`/api/routes` & `/api/vehicles`)
* `POST /api/routes/recommend` - Multi-criteria graph router balancing distance, risk, and cargo priority.
* `POST /api/vehicles/{id}/reroute` - Automatically reroute vehicle to safe detour corridor.
* `POST /api/vehicles/simulate-step` - DEMO GPS simulator advancing vehicles along routes.

### Human Verification & Alerts (`/api/verifications` & `/api/alerts`)
* `GET /api/verifications/pending` - Pending verifications queue.
* `POST /api/verifications` - Submit verifier decision; triggers road blockage and vehicle rerouting if verified.
* `GET /api/alerts` - List active alerts.

### Interactive Demo Engine (`/api/demo`)
* `POST /api/demo/run-scenario` - Executes the complete 13-step end-to-end demonstration flow.

---

## 6. How to Run

### Method A: With Docker Compose (Recommended)

```bash
# Clone and navigate to project root
cd sih

# Build and start all services (PostgreSQL/PostGIS, Backend, Frontend)
docker compose up --build
```
* **Frontend**: Open `http://localhost:3000`
* **Backend Swagger Docs**: Open `http://localhost:8000/docs`

### Method B: Local Python Development Setup (Without Docker)

#### 1. Setup & Run Backend:
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed realistic NER database & train ML model
python seed.py

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Run Tests:
```bash
cd backend
pytest -v
```

#### 3. Setup & Run Frontend:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite React server
npm run dev
```
Open browser at `http://localhost:3000`.

---

## 7. Demo Login Credentials

All users have default password: **`password123`**

| Role | Email | Scope |
|---|---|---|
| **ADMIN** | `admin@avighna.gov.in` | Full System Access |
| **FIELD OFFICER** | `field@avighna.gov.in` | Report Field Incidents & Photos |
| **VERIFIER** | `verifier@avighna.gov.in` | Verify/Reject Critical Incidents |
| **DISTRICT PLANNER** | `planner@avighna.gov.in` | View Accessibility & Corridors |
| **LOGISTICS OPERATOR** | `logistics@avighna.gov.in` | Fleet Tracking & Rerouting |

---

## 8. Complete Demonstration Workflow

To demonstrate the full end-to-end functionality during evaluation:
1. Log in to the web dashboard (`http://localhost:3000`).
2. Click the green **`RUN DEMO SCENARIO`** button in the top navbar.
3. The system will execute the 13-step pipeline:
   - **Step 1**: Heavy monsoon precipitation (95mm) recorded in East Khasi Hills.
   - **Step 2**: ML Risk Engine evaluates terrain -> Calculates **Risk Score 72/100 (HIGH)**.
   - **Step 3**: System issues **HIGH-RISK ALERT** and creates a Pending Verification Request.
   - **Step 4**: Verifier approves field incident -> Guwahati-Shillong Highway status updates to **BLOCKED**.
   - **Step 5**: System identifies Emergency Supply vehicle `AS-01-EV-1024` on corridor -> NetworkX engine computes safer detour -> Vehicle status automatically updated to **REROUTED** with recalculated ETA.
   - **Step 6**: Dashboard KPIs automatically update in real-time.

---

## 9. Data Transparency Statement

In compliance with hackathon regulations:
* Terrain, meteorology, road networks, and logistics records provided in `seed.py` are realistic synthesized representations of North Eastern Region corridors (Guwahati, Shillong, Silchar, Tezpur, Kohima, Imphal). They are labeled as **DEMO/SIMULATED** prototype data.
* The ML Risk Model uses a real `RandomForestRegressor` trained on topographical features.
