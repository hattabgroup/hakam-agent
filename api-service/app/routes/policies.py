from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Union
from pydantic import BaseModel
from .. import security, models, database

router = APIRouter(prefix="/policy", tags=["policies"])

# Schemas
class RuleCreate(BaseModel):
    name: str
    severity: Union[str, int]
    rule_text: str
    enabled: bool = True

class RuleResponse(RuleCreate):
    id: int
    category_id: int
    severity: int
    class Config:
        orm_mode = True

class CategoryCreate(BaseModel):
    name: str
    description: str = None

class CategoryResponse(CategoryCreate):
    id: int
    rules: List[RuleResponse] = []
    class Config:
        orm_mode = True

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    new_cat = models.PolicyCategory(user_id=current_user.id, **category.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    return db.query(models.PolicyCategory).filter(models.PolicyCategory.user_id == current_user.id).all()

@router.put("/categories/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, category: CategoryCreate, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    db_cat = db.query(models.PolicyCategory).filter(models.PolicyCategory.id == cat_id, models.PolicyCategory.user_id == current_user.id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_cat.name = category.name
    db_cat.description = category.description
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    db_cat = db.query(models.PolicyCategory).filter(models.PolicyCategory.id == cat_id, models.PolicyCategory.user_id == current_user.id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_cat)
    db.commit()
    return {"message": "Category deleted"}

@router.get("/categories/{cat_id}/rules", response_model=List[RuleResponse])
def list_rules(cat_id: int, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    # Verify ownership of category
    cat = db.query(models.PolicyCategory).filter(models.PolicyCategory.id == cat_id, models.PolicyCategory.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return db.query(models.PolicyRule).filter(models.PolicyRule.category_id == cat_id).all()

def normalize_severity(severity: Union[str, int]) -> int:
    if isinstance(severity, int):
        return severity
    
    severity_map = {
        "CRITICAL": 5,
        "HIGH": 4,
        "MEDIUM": 3,
        "WARNING": 3,
        "LOW": 2,
        "INFO": 1
    }
    return severity_map.get(str(severity).upper(), 1)

@router.post("/categories/{cat_id}/rules", response_model=RuleResponse)
def create_rule(cat_id: int, rule: RuleCreate, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    # Verify ownership
    cat = db.query(models.PolicyCategory).filter(models.PolicyCategory.id == cat_id, models.PolicyCategory.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    severity_int = normalize_severity(rule.severity)
    
    # Exclude severity from dict to key-value overwrite
    rule_data = rule.dict()
    rule_data['severity'] = severity_int
    
    new_rule = models.PolicyRule(category_id=cat_id, **rule_data)
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.put("/rules/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, rule: RuleCreate, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    # Find rule and verify ownership through category
    db_rule = db.query(models.PolicyRule).join(models.PolicyCategory).filter(
        models.PolicyRule.id == rule_id, 
        models.PolicyCategory.user_id == current_user.id
    ).first()
    
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db_rule.name = rule.name
    db_rule.severity = normalize_severity(rule.severity)
    db_rule.rule_text = rule.rule_text
    db_rule.enabled = rule.enabled
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(database.get_db), current_user: models.UserLocal = Depends(security.get_current_user)):
    # Find rule and verify ownership through category
    db_rule = db.query(models.PolicyRule).join(models.PolicyCategory).filter(
        models.PolicyRule.id == rule_id, 
        models.PolicyCategory.user_id == current_user.id
    ).first()
    
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted"}
