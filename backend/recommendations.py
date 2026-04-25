from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

class RecommendationResponse(BaseModel):
    id: int
    product_id: int
    current_price: float
    recommended_price: float
    confidence_score: float
    rationale: str
    status: str
    agent_outputs: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None

    class Config:
        from_attributes = True

class ApproveAction(BaseModel):
    override_price: Optional[float] = None

class RejectAction(BaseModel):
    rejection_reason: str

@router.get("/", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Recommendation).filter(models.Recommendation.org_id == current_user.org_id).order_by(models.Recommendation.created_at.desc()).all()

@router.get("/{rec_id}", response_model=RecommendationResponse)
def get_recommendation(rec_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id, models.Recommendation.org_id == current_user.org_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec

@router.post("/{rec_id}/approve")
def approve_recommendation(rec_id: int, action: ApproveAction, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id, models.Recommendation.org_id == current_user.org_id).first()
    if not rec or rec.status != "pending":
        raise HTTPException(status_code=400, detail="Invalid recommendation or status")
        
    final_price = action.override_price if action.override_price else rec.recommended_price
    
    rec.status = "approved"
    rec.reviewed_at = datetime.now(timezone.utc)
    rec.reviewed_by = current_user.id
    
    db.add(models.ApprovalAction(
        recommendation_id=rec.id, user_id=current_user.id, action="approve", override_price=final_price
    ))
    
    product = db.query(models.Product).filter(models.Product.id == rec.product_id).first()
    old_price = product.current_price
    product.current_price = final_price
    
    db.add(models.AuditLog(
        org_id=product.org_id, product_id=product.id, recommendation_id=rec.id,
        old_price=old_price, new_price=final_price, executed_by=current_user.id
    ))
    
    db.commit()
    return {"message": "Recommendation approved", "new_price": final_price}

@router.post("/{rec_id}/reject")
def reject_recommendation(rec_id: int, action: RejectAction, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id, models.Recommendation.org_id == current_user.org_id).first()
    if not rec or rec.status != "pending":
        raise HTTPException(status_code=400, detail="Invalid recommendation or status")
        
    rec.status = "rejected"
    rec.reviewed_at = datetime.now(timezone.utc)
    rec.reviewed_by = current_user.id
    
    db.add(models.ApprovalAction(
        recommendation_id=rec.id, user_id=current_user.id, action="reject", rejection_reason=action.rejection_reason
    ))
    
    db.commit()
    return {"message": "Recommendation rejected"}
