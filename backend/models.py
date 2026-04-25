from sqlalchemy import Column, ForeignKey, Integer, String, Float, DateTime
from datetime import datetime, timezone
from database import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    invite_code = Column(String, unique=True, index=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # Admin or Pricing Analyst

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String)
    margin_floor = Column(Float)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String)
    sku = Column(String, index=True)
    current_price = Column(Float)
    cost_of_goods = Column(Float)
    stock_level = Column(Integer)
    low_stock_threshold = Column(Integer)
    high_stock_threshold = Column(Integer)

class CompetitorPrice(Base):
    __tablename__ = "competitor_prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    competitor_name = Column(String)
    price = Column(Float)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DemandSignal(Base):
    __tablename__ = "demand_signals"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    signal_type = Column(String)
    value = Column(Float)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    current_price = Column(Float)
    recommended_price = Column(Float)
    confidence_score = Column(Float)
    rationale = Column(String)
    status = Column(String) # pending, approved, rejected, auto_executed
    agent_outputs = Column(String) # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class ApprovalAction(Base):
    __tablename__ = "approval_actions"
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # approve, reject, modify
    override_price = Column(Float, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=True)
    old_price = Column(Float)
    new_price = Column(Float)
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=True) # None if auto
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class OrgConfig(Base):
    __tablename__ = "org_config"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    auto_execute_threshold = Column(Float)
