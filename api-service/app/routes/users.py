from fastapi import APIRouter, Depends
from .. import schemas, security

router = APIRouter(prefix="/me", tags=["users"])

@router.get("/", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(security.get_current_user)):
    return current_user
