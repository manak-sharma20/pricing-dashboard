from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from database import get_db
import models
import agents
from auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])

class ProductBase(BaseModel):
    category_id: int
    name: str
    sku: str
    current_price: float
    cost_of_goods: float
    stock_level: int
    low_stock_threshold: int
    high_stock_threshold: int

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    org_id: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    products = db.query(models.Product).filter(models.Product.org_id == current_user.org_id).all()
    return products

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can create products")
    new_product = models.Product(**product.model_dump(), org_id=current_user.org_id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can edit products")
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.org_id == current_user.org_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete products")
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.org_id == current_user.org_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/analyze")
def analyze_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if product belongs to user's org
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.org_id == current_user.org_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    try:
        recommendation = agents.run_pricing_pipeline(product_id, db, current_user.id)
        return {
            "message": "Analysis complete",
            "recommendation_id": recommendation.id,
            "status": recommendation.status,
            "recommended_price": recommendation.recommended_price,
            "confidence_score": recommendation.confidence_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
