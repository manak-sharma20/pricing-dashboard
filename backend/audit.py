from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    product_id: int
    recommendation_id: Optional[int]
    old_price: float
    new_price: float
    executed_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.AuditLog).filter(models.AuditLog.org_id == current_user.org_id).order_by(models.AuditLog.created_at.desc()).all()
