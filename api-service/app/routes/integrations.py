from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, security, models, database
from ..services.mcp_client import mcp_client
from ..services import github_app

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.post("/", response_model=schemas.IntegrationResponse)
def create_integration(
    integration: schemas.IntegrationCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    # Check for existing integration to avoid duplicates
    existing_integrations = db.query(models.Integration).filter(
        models.Integration.user_id == current_user.id,
        models.Integration.provider == integration.provider
    ).all()
    
    for existing in existing_integrations:
        try:
            decrypted_token = security.decrypt_token(existing.token_encrypted)
            if decrypted_token == integration.token:
                return existing # Already exists, return successful response
        except:
            pass

    # Validate Token
    if integration.provider == "github":
        # For GitHub, the 'token' field should contain the Installation ID
        is_valid, token_or_error = github_app.validate_installation(integration.token)
        if not is_valid:
             raise HTTPException(status_code=400, detail=f"Invalid GitHub Installation: {token_or_error}")
    else:
        # For others (Bitbucket, GitLab), validate via MCP as usual
        validation = mcp_client.validate_token(integration.provider, integration.token)
        if not validation.get("valid"):
            raise HTTPException(status_code=400, detail=validation.get("message", "Invalid token"))

    # Encrypt token
    encrypted = security.encrypt_token(integration.token)
    
    new_integration = models.Integration(
        user_id=current_user.id,
        provider=integration.provider,
        token_encrypted=encrypted
    )
    db.add(new_integration)
    db.commit()
    db.refresh(new_integration)
    db.refresh(new_integration)
    return new_integration

@router.put("/{integration_id}", response_model=schemas.IntegrationResponse)
def update_integration(
    integration_id: int,
    integration_update: schemas.IntegrationUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    integration = db.query(models.Integration).filter(
        models.Integration.id == integration_id,
        models.Integration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found or unauthorized")
    
    # Validate Token
    if integration.provider == "github":
        is_valid, token_or_error = github_app.validate_installation(integration_update.token)
        if not is_valid:
             raise HTTPException(status_code=400, detail=f"Invalid GitHub Installation: {token_or_error}")
    else:
        validation = mcp_client.validate_token(integration.provider, integration_update.token)
        if not validation.get("valid"):
            raise HTTPException(status_code=400, detail=validation.get("message", "Invalid token"))

    # Encrypt new token
    encrypted = security.encrypt_token(integration_update.token)
    integration.token_encrypted = encrypted
    
    db.commit()
    db.refresh(integration)
    return integration

@router.get("/", response_model=List[schemas.IntegrationResponse])
def list_integrations(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    return db.query(models.Integration).filter(models.Integration.user_id == current_user.id).all()

@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    integration = db.query(models.Integration).filter(
        models.Integration.id == integration_id,
        models.Integration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found or unauthorized")
    
    db.delete(integration)
    db.commit()
    return {"success": True}
