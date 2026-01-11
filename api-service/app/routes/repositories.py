from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, security, models, database
from ..services.mcp_client import mcp_client

router = APIRouter(prefix="/repositories", tags=["repositories"])

@router.get("/discover", response_model=List[schemas.Repository])
def discover_repos(
    integration_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    # Find integration
    integration = db.query(models.Integration).filter(
        models.Integration.id == integration_id,
        models.Integration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Decrypt token
    token = security.decrypt_token(integration.token_encrypted)
    
    # Call MCP
    repos_data = mcp_client.list_repos(integration.provider, token)
    return repos_data

@router.post("/", response_model=List[schemas.RepositoryResponse])
def save_repos(
    repo_create: schemas.RepositoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    # Verify integration ownership
    integration = db.query(models.Integration).filter(
        models.Integration.id == repo_create.integration_id,
        models.Integration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found or unauthorized")

    saved_repos = []
    for repo_in in repo_create.repos:
        # Check if already exists for this user and integration
        existing_repo = db.query(models.Repository).filter(
            models.Repository.user_id == current_user.id,
            models.Repository.integration_id == repo_create.integration_id,
            models.Repository.repo_external_id == repo_in.repo_external_id
        ).first()

        if existing_repo:
            if not repo_in.is_enabled:
                # User wants to "disable" it, which in this flow means delete it
                db.delete(existing_repo)
            else:
                existing_repo.provider = repo_create.provider
                existing_repo.repo_full_name = repo_in.repo_full_name
                existing_repo.is_enabled = True
                saved_repos.append(existing_repo)
        else:
            if repo_in.is_enabled:
                repo = models.Repository(
                    user_id=current_user.id,
                    integration_id=repo_create.integration_id,
                    provider=repo_create.provider,
                    repo_external_id=repo_in.repo_external_id,
                    repo_full_name=repo_in.repo_full_name,
                    is_enabled=True
                )
                db.add(repo)
                saved_repos.append(repo)
    
    db.commit()
    for r in saved_repos:
        db.refresh(r)
        
    return saved_repos

@router.get("/", response_model=List[schemas.RepositoryResponse])
def list_repos(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    return db.query(models.Repository).filter(models.Repository.user_id == current_user.id).all()
