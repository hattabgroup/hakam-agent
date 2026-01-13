from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from .. import database, models, schemas, security

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

@router.get("/", response_model=List[schemas.SettingsItem])
def get_settings(
    db: Session = Depends(database.get_db),
    user: models.UserLocal = Depends(security.get_current_user)
):
    settings = db.query(models.Settings).filter(models.Settings.user_id == user.id).all()
    return [schemas.SettingsItem(key=s.key, value=s.value) for s in settings]

@router.put("/", status_code=status.HTTP_200_OK)
def update_settings(
    update_data: schemas.SettingsUpdate,
    db: Session = Depends(database.get_db),
    user: models.UserLocal = Depends(security.get_current_user)
):
    # For now, simple strategy: loop and update or insert
    # Ideally use upsert.
    
    current_settings = db.query(models.Settings).filter(models.Settings.user_id == user.id).all()
    settings_map = {s.key: s for s in current_settings}

    for item in update_data.settings:
        if item.key in settings_map:
            settings_map[item.key].value = item.value
        else:
            new_setting = models.Settings(
                user_id=user.id,
                key=item.key,
                value=item.value
            )
            db.add(new_setting)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")
        
    return {"status": "success"}
