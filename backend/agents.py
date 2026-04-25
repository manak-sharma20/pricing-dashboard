from sqlalchemy.orm import Session
import models
import json

# Agent 1 - Market Intelligence
def market_intelligence_agent(product_id: int, db: Session):
    competitor_prices = db.query(models.CompetitorPrice).filter(models.CompetitorPrice.product_id == product_id).all()
    if not competitor_prices:
        return {"average_competitor_price": None, "market_position": "Unknown"}
    
    avg_price = sum(c.price for c in competitor_prices) / len(competitor_prices)
    return {
        "average_competitor_price": avg_price,
        "lowest_competitor_price": min(c.price for c in competitor_prices),
        "highest_competitor_price": max(c.price for c in competitor_prices)
    }

# Agent 2 - Demand Forecasting
def demand_forecasting_agent(product_id: int, db: Session):
    signals = db.query(models.DemandSignal).filter(models.DemandSignal.product_id == product_id).all()
    if not signals:
        return {"demand_level": "Low", "trend": "Stable"}
        
    total_views = sum(s.value for s in signals if s.signal_type == "PAGE_VIEWS")
    total_carts = sum(s.value for s in signals if s.signal_type == "CART_ADDS")
    
    demand_level = "Medium"
    if total_views > 1000 or total_carts > 100:
        demand_level = "High"
    elif total_views < 100 and total_carts < 10:
        demand_level = "Low"
        
    return {"demand_level": demand_level, "total_views_30d": total_views, "cart_adds_30d": total_carts}

# Agent 3 - Inventory & Cost
def inventory_cost_agent(product: models.Product, category: models.Category):
    margin = (product.current_price - product.cost_of_goods) / product.current_price if product.current_price else 0
    margin_healthy = margin >= category.margin_floor
    
    inventory_status = "Optimal"
    if product.stock_level <= product.low_stock_threshold:
        inventory_status = "Understocked"
    elif product.stock_level >= product.high_stock_threshold:
        inventory_status = "Overstocked"
        
    return {
        "current_margin": margin,
        "target_margin_floor": category.margin_floor,
        "is_margin_healthy": margin_healthy,
        "inventory_status": inventory_status,
        "stock_level": product.stock_level
    }

# Agent 4 - Pricing Strategy (LLM Stub)
def pricing_strategy_agent(product: models.Product, market_data: dict, demand_data: dict, inventory_data: dict):
    recommended_price = product.current_price
    rationale = "Price remains unchanged as all indicators are stable."
    confidence = 0.5
    
    if inventory_data["inventory_status"] == "Overstocked" and demand_data["demand_level"] == "Low":
        recommended_price = product.current_price * 0.90
        rationale = "Decreasing price by 10% to clear excess inventory due to low demand."
        confidence = 0.85
    elif inventory_data["inventory_status"] == "Understocked" and demand_data["demand_level"] == "High":
        recommended_price = product.current_price * 1.15
        rationale = "Increasing price by 15% to maximize margin on low stock with high demand."
        confidence = 0.90
    elif market_data["average_competitor_price"] and product.current_price > market_data["average_competitor_price"] * 1.2:
        recommended_price = market_data["average_competitor_price"] * 1.05
        rationale = "Price is significantly higher than market average. Lowering to remain competitive."
        confidence = 0.75

    # Enforce margin floor
    if (recommended_price - product.cost_of_goods) / recommended_price < inventory_data["target_margin_floor"]:
        recommended_price = product.cost_of_goods / (1 - inventory_data["target_margin_floor"])
        rationale += f" [Adjusted to meet margin floor of {inventory_data['target_margin_floor']*100}%]"
        confidence -= 0.2

    return {
        "recommended_price": round(recommended_price, 2),
        "confidence_score": round(max(0.1, min(confidence, 1.0)), 2),
        "rationale": rationale
    }

# Agent 5 - Execution & Compliance
def execution_compliance_agent(recommendation_data: dict, auto_execute_threshold: float):
    if recommendation_data["confidence_score"] >= auto_execute_threshold:
        return "auto_executed"
    return "pending"

def run_pricing_pipeline(product_id: int, db: Session, user_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")
        
    category = db.query(models.Category).filter(models.Category.id == product.category_id).first()
    config = db.query(models.OrgConfig).filter(models.OrgConfig.org_id == product.org_id).first()
    threshold = config.auto_execute_threshold if config else 0.90
    
    # Run Agents
    market_data = market_intelligence_agent(product_id, db)
    demand_data = demand_forecasting_agent(product_id, db)
    inventory_data = inventory_cost_agent(product, category)
    strategy_data = pricing_strategy_agent(product, market_data, demand_data, inventory_data)
    status = execution_compliance_agent(strategy_data, threshold)
    
    agent_outputs = {
        "market_intelligence": market_data,
        "demand_forecasting": demand_data,
        "inventory_cost": inventory_data,
        "pricing_strategy": strategy_data
    }
    
    rec = models.Recommendation(
        org_id=product.org_id,
        product_id=product.id,
        current_price=product.current_price,
        recommended_price=strategy_data["recommended_price"],
        confidence_score=strategy_data["confidence_score"],
        rationale=strategy_data["rationale"],
        status=status,
        agent_outputs=json.dumps(agent_outputs)
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    
    if status == "auto_executed":
        old_price = product.current_price
        product.current_price = strategy_data["recommended_price"]
        db.add(models.AuditLog(
            org_id=product.org_id,
            product_id=product.id,
            recommendation_id=rec.id,
            old_price=old_price,
            new_price=strategy_data["recommended_price"],
            executed_by=None # Auto
        ))
        db.commit()
        
    return rec
