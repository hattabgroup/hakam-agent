from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Header
from sqlalchemy.orm import Session
from .. import schemas, models, database
from ..routes.reviews import process_llm_review
import os
import hashlib
import hmac
import json

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "supersecret")

async def verify_github_signature(request: Request):
    signature_header = request.headers.get("X-Hub-Signature-256")
    if not signature_header:
        raise HTTPException(status_code=403, detail="Missing signature")
    
    sha_name, signature = signature_header.split("=")
    if sha_name != "sha256":
         raise HTTPException(status_code=403, detail="Invalid signature algorithm")

    body = await request.body()
    mac = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256)
    
    if not hmac.compare_digest(mac.hexdigest(), signature):
         raise HTTPException(status_code=403, detail="Invalid key")

@router.post("/{provider}")
async def handle_webhook(
    provider: str,
    request: Request,
    background_tasks: BackgroundTasks,
    secret: str = None, # For Bitbucket query param
    db: Session = Depends(database.get_db)
):
    if provider == "github":
        await verify_github_signature(request)
        payload = await request.json()
        event = request.headers.get("X-GitHub-Event")
        
        if event == "pull_request":
            action = payload.get("action")
            if action in ["opened", "synchronize", "reopened"]:
                pr_data = payload.get("pull_request")
                repo_data = payload.get("repository")
                
                # Extract info
                repo_full_name = repo_data.get("full_name")
                pr_number = str(pr_data.get("number"))
                repo_external_id = str(repo_data.get("id"))
                
                # Find Repository in DB
                repo = db.query(models.Repository).filter(models.Repository.repo_full_name == repo_full_name).first()
                if not repo:
                    print(f"Repo {repo_full_name} not found in DB. Skipping.")
                    return {"status": "skipped", "reason": "repo_not_found"}
                
                if not repo.is_enabled:
                    print(f"Repo {repo_full_name} is disabled. Skipping.")
                    return {"status": "skipped", "reason": "repo_disabled"}

                # Extract Author
                user_data = pr_data.get("user", {})
                pr_author = user_data.get("name") or user_data.get("login") or "Unknown"

                # Find or Create PR
                pr = db.query(models.PullRequest).filter(models.PullRequest.repo_id == repo.id, models.PullRequest.pr_external_id == pr_number).first()
                if not pr:
                    pr = models.PullRequest(repo_id=repo.id, pr_external_id=pr_number, author=pr_author)
                    db.add(pr)
                    db.commit()
                else:
                    # Update author if missing
                    if not pr.author:
                        pr.author = pr_author
                        db.commit()
                
                # Create Review
                review = models.Review(pr_id=pr.id, status=models.ReviewStatus.QUEUED)
                db.add(review)
                db.commit()
                db.refresh(review)
                
                print(f"Triggering auto-review for {repo_full_name} PR #{pr_number}")
                background_tasks.add_task(process_llm_review, review.id, repo.user_id, db, auto_publish=True)
                return {"status": "triggered", "review_id": review.id}

    elif provider == "bitbucket":
        # Bitbucket doesn't sign payloads, so we rely on the secret query param
        if secret != WEBHOOK_SECRET:
             raise HTTPException(status_code=403, detail="Invalid secret")
        
        payload = await request.json()
        # Bitbucket events: pullrequest:created, pullrequest:updated
        # The event key is in the header 'X-Event-Key'
        event_key = request.headers.get("X-Event-Key")
        
        if event_key in ["pullrequest:created", "pullrequest:updated"]:
             pr_data = payload.get("pullrequest")
             repo_data = payload.get("repository")
             
             repo_full_name = repo_data.get("full_name")
             pr_number = str(pr_data.get("id"))
             
             # Find Repository
             repo = db.query(models.Repository).filter(models.Repository.repo_full_name == repo_full_name).first()
             if not repo:
                 return {"status": "skipped", "reason": "repo_not_found"}
             
             if not repo.is_enabled:
                 return {"status": "skipped", "reason": "repo_disabled"}

             # Extract Author
             pr_author = pr_data.get("author", {}).get("display_name") or pr_data.get("author", {}).get("nickname") or "Unknown"

             # Find or Create PR
             pr = db.query(models.PullRequest).filter(models.PullRequest.repo_id == repo.id, models.PullRequest.pr_external_id == pr_number).first()
             if not pr:
                 pr = models.PullRequest(repo_id=repo.id, pr_external_id=pr_number, author=pr_author)
                 db.add(pr)
                 db.commit()
             else:
                    # Update author if missing
                    if not pr.author:
                        pr.author = pr_author
                        db.commit()

             # Create Review
             review = models.Review(pr_id=pr.id, status=models.ReviewStatus.QUEUED)
             db.add(review)
             db.commit()
             db.refresh(review)
             
             background_tasks.add_task(process_llm_review, review.id, repo.user_id, db, auto_publish=True)
             return {"status": "triggered", "review_id": review.id}
             
    return {"status": "ignored"}
