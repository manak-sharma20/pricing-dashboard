import sys
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from auth import get_password_hash
import random
from datetime import datetime, timedelta, timezone

def seed_database():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(models.Organization).first():
        print("Database already seeded.")
        return
        
    print("Seeding database...")
    
    org1 = models.Organization(name="TechCorp", invite_code="TECH123")
    org2 = models.Organization(name="RetailGurus", invite_code="RETAIL456")
    db.add_all([org1, org2])
    db.commit()
    
    admin1 = models.User(org_id=org1.id, email="admin@techcorp.com", password_hash=get_password_hash("password"), role="Admin")
    analyst1 = models.User(org_id=org1.id, email="analyst@techcorp.com", password_hash=get_password_hash("password"), role="Pricing Analyst")
    admin2 = models.User(org_id=org2.id, email="admin@retailgurus.com", password_hash=get_password_hash("password"), role="Admin")
    db.add_all([admin1, analyst1, admin2])
    db.commit()
    
    cat1 = models.Category(org_id=org1.id, name="Laptops", margin_floor=0.15)
    cat2 = models.Category(org_id=org1.id, name="Accessories", margin_floor=0.25)
    cat3 = models.Category(org_id=org2.id, name="Furniture", margin_floor=0.30)
    db.add_all([cat1, cat2, cat3])
    db.commit()
    
    prod1 = models.Product(org_id=org1.id, category_id=cat1.id, name="ThinkPad X1 Carbon", sku="LAP-TP-X1", current_price=1500.0, cost_of_goods=1200.0, stock_level=50, low_stock_threshold=10, high_stock_threshold=100)
    prod2 = models.Product(org_id=org1.id, category_id=cat1.id, name="MacBook Air M2", sku="LAP-MB-M2", current_price=1200.0, cost_of_goods=950.0, stock_level=120, low_stock_threshold=20, high_stock_threshold=100)
    prod3 = models.Product(org_id=org1.id, category_id=cat2.id, name="Logitech MX Master 3", sku="ACC-LOG-MX3", current_price=99.99, cost_of_goods=50.0, stock_level=5, low_stock_threshold=15, high_stock_threshold=50)
    db.add_all([prod1, prod2, prod3])
    db.commit()
    
    now = datetime.now(timezone.utc)
    for p in [prod1, prod2, prod3]:
        for _ in range(5):
            comp_price = p.current_price * random.uniform(0.9, 1.1)
            db.add(models.CompetitorPrice(product_id=p.id, competitor_name=f"Competitor_{random.randint(1,3)}", price=comp_price, recorded_at=now - timedelta(days=random.randint(1, 30))))
        
        for _ in range(5):
            db.add(models.DemandSignal(product_id=p.id, signal_type=random.choice(["PAGE_VIEWS", "CART_ADDS", "CONVERSIONS"]), value=random.randint(10, 1000), recorded_at=now - timedelta(days=random.randint(1, 30))))
            
    db.commit()
    
    db.add(models.OrgConfig(org_id=org1.id, auto_execute_threshold=0.85))
    db.add(models.OrgConfig(org_id=org2.id, auto_execute_threshold=0.90))
    db.commit()
    
    print("Database seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_database()
