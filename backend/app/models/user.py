from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="FIELD_OFFICER")
    # Roles: ADMIN, FIELD_OFFICER, VERIFIER, DISTRICT_PLANNER, LOGISTICS_OPERATOR
    district = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
