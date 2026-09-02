import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app import models  # Ensure all ORM models are loaded

# Routers
from app.routers import (
    auth, incidents, roads, vehicles, routes, risk, alerts, verification, logistics, dashboard, map, demo
)

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    # AVIGHNA - AI-Powered Smart Logistics & Accessibility Intelligence for NER
    
    AVIGHNA transitions emergency logistics & accessibility decision-making from reactive response to:
    **EARLY DETECTION → RISK PREDICTION → SMART DECISION → ACTION** (`SENSE → COMPREHEND → FORECAST → ACT`).
    
    ### API Capabilities:
    * **Authentication & RBAC**: JWT auth with role authorization (`ADMIN`, `FIELD_OFFICER`, `VERIFIER`, `DISTRICT_PLANNER`, `LOGISTICS_OPERATOR`).
    * **Incidents & Computer Vision**: Field incident reporting with CV photo hazard analysis.
    * **AI Risk Engine**: Machine Learning Random Forest risk prediction (0-100 score, reasons, actions).
    * **Road Network & GeoJSON**: Accessibility engine outputting GeoJSON map features.
    * **Route Recommendation**: Multi-weighted NetworkX routing graph engine for safe corridors.
    * **Vehicle Tracking & Rerouting**: Live fleet GPS tracking with automated rerouting on corridor blockage.
    * **Human Verification & Alerts**: Verification workflow and system alerting console.
    * **Interactive Demo Scenario Engine**: Executable 13-step end-to-end demonstration workflow.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(incidents.router, prefix=api_prefix)
app.include_router(roads.router, prefix=api_prefix)
app.include_router(vehicles.router, prefix=api_prefix)
app.include_router(routes.router, prefix=api_prefix)
app.include_router(risk.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(verification.router, prefix=api_prefix)
app.include_router(logistics.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(map.router, prefix=api_prefix)
app.include_router(demo.router, prefix=api_prefix)

# Custom Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        print(f"Global exception caught on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check system logs."}
    )

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "swagger_docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
