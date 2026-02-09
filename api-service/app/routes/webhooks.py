from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Header
from sqlalchemy.orm import Session
from .. import schemas, models, database
from ..routes.reviews import process_llm_review
import os
import hashlib
import hmac
import json
import fnmatch

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

def is_branch_excluded(branch_name: str, excluded_patterns_str: str) -> bool:
    if not branch_name or not excluded_patterns_str:
        return False
    
    patterns = [p.strip() for p in excluded_patterns_str.split(",") if p.strip()]
    for pattern in patterns:
        if fnmatch.fnmatch(branch_name, pattern):
            return True
    return False

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
                
                # Extract Branches
                source_branch = pr_data.get("head", {}).get("ref")
                target_branch = pr_data.get("base", {}).get("ref")
                
                # Find Repositories (Fetch ALL matching)
                repos = db.query(models.Repository).filter(models.Repository.repo_full_name == repo_full_name).all()
                
                # Github names are case-insensitive in reality but standard is exact match in API.
                # However, we can add fallback if needed, but usually GitHub sends canonical name.
                # If needed, we can reuse the fallback logic or stick to strict first. 
                # Let's add fallback just in case for robustness similar to Bitbucket.
                if not repos:
                    all_repos = db.query(models.Repository).filter(models.Repository.provider == "github").all()
                    repos = [r for r in all_repos if r.repo_full_name.lower() == repo_full_name.lower()]
                    if repos:
                        print(f"Found {len(repos)} GitHub repo(s) via case-insensitive match")

                if not repos:
                    print(f"Repo {repo_full_name} not found in DB. Skipping.")
                    return {"status": "skipped", "reason": "repo_not_found"}
                
                triggered_count = 0
                for repo in repos:
                    if not repo.is_enabled:
                        print(f"Repo {repo_full_name} (User {repo.user_id}) is disabled. Skipping.")
                        continue
                    
                    # Check for Excluded Branches
                    settings = db.query(models.Settings).filter(models.Settings.user_id == repo.user_id, models.Settings.key == "excluded_branches").first()
                    excluded_branches_str = settings.value if settings else ""
                    
                    if is_branch_excluded(source_branch, excluded_branches_str) or is_branch_excluded(target_branch, excluded_branches_str):
                        print(f"Skipping review for {repo_full_name} PR #{pr_number}. Branch excluded. Source: {source_branch}, Target: {target_branch}, Excluded: {excluded_branches_str}")
                        continue
    
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
                    
                    print(f"Triggering auto-review for {repo_full_name} PR #{pr_number} (User {repo.user_id})")
                    background_tasks.add_task(process_llm_review, review.id, repo.user_id, db, auto_publish=True)
                    triggered_count += 1

                return {"status": "triggered", "count": triggered_count}

    elif provider == "bitbucket":
        # Bitbucket doesn't sign payloads, so we rely on the secret query param
        if secret != WEBHOOK_SECRET:
             print(f"Bitbucket Webhook Secret Mismatch. Expected: {WEBHOOK_SECRET}, Got: {secret}")
             raise HTTPException(status_code=403, detail="Invalid secret")
        
        payload = await request.json()
        event_key = request.headers.get("X-Event-Key")
        
        print(f"Received Bitbucket Event: {event_key}")
        
        if event_key in ["pullrequest:created", "pullrequest:updated"]:
             pr_data = payload.get("pullrequest")
             repo_data = payload.get("repository")
             
             repo_full_name = repo_data.get("full_name")
             pr_number = str(pr_data.get("id"))
             
             # Extract Branches
             source_branch = pr_data.get("source", {}).get("branch", {}).get("name")
             target_branch = pr_data.get("destination", {}).get("branch", {}).get("name")
             
             print(f"Processing Bitbucket PR: {repo_full_name} #{pr_number}")
             
             # Find Repositories (Fetch ALL matching)
             # Try exact match first
             repos = db.query(models.Repository).filter(models.Repository.repo_full_name == repo_full_name).all()
             
             # Fallback to case-insensitive match if not found
             if not repos:
                 all_repos = db.query(models.Repository).filter(models.Repository.provider == "bitbucket").all()
                 repos = [r for r in all_repos if r.repo_full_name.lower() == repo_full_name.lower()]
                 if repos:
                      print(f"Found {len(repos)} repo(s) via case-insensitive match")

             if not repos:
                 print(f"Repo {repo_full_name} not found in DB (checked {db.query(models.Repository).count()} repos).")
                 return {"status": "skipped", "reason": "repo_not_found"}
             
             triggered_count = 0
             
             for repo in repos:
                 if not repo.is_enabled:
                     print(f"Repo {repo.repo_full_name} (User {repo.user_id}) is disabled. Skipping.")
                     continue
    
                 # Check for Excluded Branches
                 settings = db.query(models.Settings).filter(models.Settings.user_id == repo.user_id, models.Settings.key == "excluded_branches").first()
                 excluded_branches_str = settings.value if settings else ""
                 
                 if is_branch_excluded(source_branch, excluded_branches_str) or is_branch_excluded(target_branch, excluded_branches_str):
                     print(f"Skipping review for {repo_full_name} PR #{pr_number}. Branch excluded. Source: {source_branch}, Target: {target_branch}, Excluded: {excluded_branches_str}")
                     continue
    
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
                 
                 print(f"Triggering auto-review for {repo_full_name} PR #{pr_number} (User {repo.user_id})")
                 background_tasks.add_task(process_llm_review, review.id, repo.user_id, db, auto_publish=True)
                 triggered_count += 1
                 
             return {"status": "triggered", "count": triggered_count}
             
    return {"status": "ignored"}
