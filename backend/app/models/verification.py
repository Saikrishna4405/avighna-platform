from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    verifier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decision = Column(String(20), nullable=False)  # VERIFIED, REJECTED
    remarks = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
