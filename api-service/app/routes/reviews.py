from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from .. import schemas, security, models, database
from ..services.mcp_client import mcp_client
from ..services.llm import LLMService
import os

router = APIRouter(prefix="/reviews", tags=["reviews"])
internal_router = APIRouter(prefix="/internal/reviews", tags=["internal"])

INTERNAL_WORKER_SECRET = os.getenv("INTERNAL_WORKER_SECRET")

# --- Helper Functions ---

def publish_review_internal(review: models.Review, db: Session, dry_run: bool = False):
    # Build summary body
    body = f"## Hakam Review Summary\n\n{review.summary or 'No summary provided.'}\n\n"
    if not review.violations:
        body += "No violations found. LGTM! 🚀"

    if not dry_run:
        # Decrypt token
        # Decrypt token
        if review.pull_request.repository.integration_id:
             integration = db.query(models.Integration).filter(models.Integration.id == review.pull_request.repository.integration_id).first()
        else:
             integration = db.query(models.Integration).filter(
                models.Integration.user_id == review.pull_request.repository.user_id,
                models.Integration.provider == review.pull_request.repository.provider
            ).first()
        
        if not integration:
            raise Exception("Integration not found for publishing")
            
        token = security.decrypt_token(integration.token_encrypted)
        
        # Prepare inline comments
        comments = []
        seen_comments = set()
        
        for v in review.violations:
            # Skip invalid paths (like 'unknown' or 'string' from manual tests)
            if not v.file_path or v.file_path in ["unknown", "string"]:
                continue
                
            severity_map = {
                5: "CRITICAL",
                4: "HIGH",
                3: "WARNING",
                2: "LOW",
                1: "INFO"
            }
            severity_label = severity_map.get(v.severity, "INFO")
            rule_name = v.policy_rule.name if v.policy_rule else 'Rule Violation'
            body_text = f"**[{severity_label}]** {rule_name}\n\n{v.message}"
            
            # Deduplicate (prevent double-posting same issue on same line)
            comment_sig = (v.file_path, v.line_start, body_text)
            if comment_sig not in seen_comments:
                comments.append({
                    "path": v.file_path,
                    "line": v.line_start,
                    "body": body_text
                })
                seen_comments.add(comment_sig)
        
        # Call MCP for PR Review
        try:
            result = mcp_client.create_review(
                review.pull_request.repository.provider, 
                token, 
                review.pull_request.repository.repo_full_name, 
                review.pull_request.pr_external_id, 
                comments,
                body
            )
            review.provider_comment_id = result.get("review_id")
        except Exception as e:
            raise Exception(f"Failed to publish via MCP: {str(e)}")

    review.published_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    return review

def process_llm_review(review_id: int, user_id: int, db: Session, auto_publish: bool = False):
    with database.SessionLocal() as session:
        try:
            review = session.query(models.Review).filter(models.Review.id == review_id).first()
            if not review:
                print(f"Review {review_id} not found in background task")
                return

            review.status = models.ReviewStatus.RUNNING
            session.commit()

            # Fetch Settings
            settings = session.query(models.Settings).filter(models.Settings.user_id == user_id).all()
            
            # Fetch Policies
            policies = session.query(models.PolicyCategory).filter(models.PolicyCategory.user_id == user_id).all()
            
            # Check for LLM Configuration
            settings_map = {s.key: s.value for s in settings}
            if 'llm_api_key' not in settings_map or not settings_map['llm_api_key']:
                print("LLM API Key not found")
                review.status = models.ReviewStatus.FAILED
                review.summary = "You don't have any LLM integration configured. Please configure an AI provider in the [Settings Page](/dashboard/settings)."
                session.commit()
                return

            # Fetch Diff
            # We need the token
            repo = review.pull_request.repository
            
            # Use specific integration ID if available
            if repo.integration_id:
                print(f"[Debug] Using specific integration_id: {repo.integration_id}")
                integration = session.query(models.Integration).filter(models.Integration.id == repo.integration_id).first()
            else:
                # Fallback (Legacy)
                print(f"[Debug] Fallback to user_id {user_id} + provider {repo.provider}")
                integration = session.query(models.Integration).filter(
                    models.Integration.user_id == user_id, 
                    models.Integration.provider == repo.provider
                ).first()
            
            if integration:
                print(f"[Debug] Integration Found: ID={integration.id}, Provider={integration.provider}, User={integration.user_id}")
            
            if not integration:
                print("Integration not found")
                review.status = models.ReviewStatus.FAILED
                review.summary = "Integration not found."
                session.commit()
                return

            token = security.decrypt_token(integration.token_encrypted)
            
            # Get Diff from MCP
            try:
                diff = mcp_client.get_pr_diff(repo.provider, token, repo.repo_full_name, review.pull_request.pr_external_id)
            except Exception as e:
                 # Fallback/Error if not implemented
                 print(f"mcp_client.get_pr_diff error: {e}")
                 review.status = models.ReviewStatus.FAILED
                 review.summary = "Failed to fetch PR diff."
                 session.commit()
                 return
            
            # Run Analysis
            llm = LLMService(settings)
            violations = llm.analyze_code(diff, policies)
            
            # Save Results
            for v in violations:
                 # Map logic similar to submit_result
                 cat_id = None
                 rule_id = None
                 
                 if v.category:
                     cat = session.query(models.PolicyCategory).filter(models.PolicyCategory.user_id == user_id, models.PolicyCategory.name == v.category).first()
                     if cat: cat_id = cat.id
                 
                 if v.rule_name and cat_id:
                     rule = session.query(models.PolicyRule).filter(models.PolicyRule.category_id == cat_id, models.PolicyRule.name == v.rule_name).first()
                     if rule: rule_id = rule.id

                 # Severity Map
                 severity_map = {"CRITICAL": 5, "HIGH": 4, "MEDIUM": 3, "WARNING": 3, "LOW": 2, "INFO": 1}
                 sev_int = severity_map.get(str(v.severity).upper(), 3)

                 new_violation = models.ReviewViolation(
                     review_id=review.id,
                     policy_category_id=cat_id,
                     policy_rule_id=rule_id,
                     severity=sev_int,
                     file_path=v.file_path,
                     line_start=v.line_start,
                     line_end=v.line_end,
                     message=v.message
                 )
                 session.add(new_violation)
            
            review.status = models.ReviewStatus.DONE
            review.summary = f"LLM Review Completed. Found {len(violations)} issues."
            session.commit()

            # Auto Publish
            if auto_publish:
                try:
                    # Need to refresh review or query again to get violations?
                    # Session is open, we added violations. They should be in review.violations?
                    # Since we added to session but didn't refresh review.
                    # It's safer to query again or rely on relationship.
                    # Let's commit first (done above), then call internal publish.
                    # But internal publish uses 'db' arg. We should pass 'session'.
                    publish_review_internal(review, session, dry_run=False)
                    print(f"Auto-published review {review.id}")
                except Exception as e:
                    print(f"Auto-publish failed: {e}")
                    # Could update status to reflect publish fail, but review is technically done.

        except Exception as e:
            print(f"Background Review Failed: {e}")
            if review:
                review.status = models.ReviewStatus.FAILED
                review.summary = str(e)
                session.commit()

# --- User Endpoints ---

@router.post("/run", response_model=schemas.ReviewResponse)
def run_review(
    request: schemas.ReviewRunRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    # Get Repo
    repo = db.query(models.Repository).filter(models.Repository.id == request.repo_id, models.Repository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Find or Create Pull Request
    pr = db.query(models.PullRequest).filter(models.PullRequest.repo_id == repo.id, models.PullRequest.pr_external_id == request.pr_number).first()
    if not pr:
        pr = models.PullRequest(repo_id=repo.id, pr_external_id=request.pr_number)
        db.add(pr)
        db.commit()
    
    # Create Review
    review = models.Review(pr_id=pr.id, status=models.ReviewStatus.QUEUED)
    db.add(review)
    db.commit()
    db.refresh(review)

    # Trigger LLM Review in Background
    background_tasks.add_task(process_llm_review, review.id, current_user.id, db)

    return review

@router.get("/stats", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    # Active Repos
    repos = db.query(models.Repository).filter(models.Repository.user_id == current_user.id, models.Repository.is_enabled == True).all()
    active_repos_count = len(repos)
    
    # Calculate Critical Issues & Quality Score from LATEST reviews of each repo
    total_critical = 0
    total_score = 0
    repos_with_reviews = 0
    
    for repo in repos:
        latest_review = db.query(models.Review).join(models.PullRequest).filter(
            models.PullRequest.repo_id == repo.id,
            models.Review.status == models.ReviewStatus.DONE
        ).order_by(models.Review.created_at.desc()).first()
        
        if latest_review:
            repos_with_reviews += 1
            # Severity 5 = Critical
            crit = len([v for v in latest_review.violations if v.severity == 5])
            high = len([v for v in latest_review.violations if v.severity == 4])
            med = len([v for v in latest_review.violations if v.severity == 3])
            
            total_critical += crit
            
            # Simple score: 100 - penalties
            score = max(0, 100 - (crit * 20 + high * 10 + med * 5))
            total_score += score

    avg_score = int(total_score / repos_with_reviews) if repos_with_reviews > 0 else 100

    # Recent Reviews (Table)
    recent_reviews = db.query(models.Review).join(models.PullRequest).join(models.Repository).filter(
        models.Repository.user_id == current_user.id
    ).order_by(models.Review.created_at.desc()).limit(5).all()
    
    recent_summary = []
    for r in recent_reviews:
        score = "N/A"
        date_str = "Just now"
        status_text = "Pending"
        
        # Calculate time ago
        if r.created_at:
            delta = datetime.utcnow() - r.created_at
            hours = delta.seconds // 3600
            days = delta.days
            if days > 0:
                date_str = f"{days}d ago"
            elif hours > 0:
                date_str = f"{hours}h ago"
            else:
                minutes = delta.seconds // 60
                date_str = f"{minutes}m ago"

        if r.status == models.ReviewStatus.DONE:
            crit = len([v for v in r.violations if v.severity == 5])
            high = len([v for v in r.violations if v.severity == 4])
            med = len([v for v in r.violations if v.severity == 3])
            
            if crit > 0: 
                status_text = "Critical" 
            elif high > 0:
                 status_text = "Warning"
            elif med > 0:
                 status_text = "Issues"
            else:
                status_text = "Clean"
                
            score_val = max(0, 100 - (crit * 20 + high * 10 + med * 5))
            score = f"{score_val}/100"
        elif r.status == models.ReviewStatus.FAILED:
             status_text = "Failed"
             score = "0/100"
        else:
             status_text = "Running"
             score = "-/100"

        recent_summary.append(schemas.DashboardReviewSummary(
            repo=r.pull_request.repository.repo_full_name,
            status=status_text,
            score=score,
            date=date_str
        ))

    return schemas.DashboardStatsResponse(
        active_repos=active_repos_count,
        active_repos_change="", 
        quality_score=f"{avg_score}%",
        quality_score_change="", 
        critical_issues=total_critical,
        critical_issues_change="", 
        recent_reviews=recent_summary
    )

@router.get("/{review_id}", response_model=schemas.ReviewResponse)
def get_review(
    review_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    review = db.query(models.Review).join(models.PullRequest).join(models.Repository).filter(
        models.Review.id == review_id,
        models.Repository.user_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.get("/", response_model=List[schemas.ReviewResponse])
def list_reviews(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    reviews = db.query(models.Review).join(models.PullRequest).join(models.Repository).filter(
        models.Repository.user_id == current_user.id
    ).order_by(models.Review.created_at.desc()).all()
    return reviews

@router.post("/{review_id}/publish", response_model=schemas.ReviewResponse)
def publish_review(
    review_id: int,
    request: schemas.ReviewPublishRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    review = db.query(models.Review).join(models.PullRequest).join(models.Repository).filter(
        models.Review.id == review_id,
        models.Repository.user_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    try:
        updated_review = publish_review_internal(review, db, request.dry_run)
        return updated_review
    except Exception as e:
        if "Integration not found" in str(e):
             raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# --- Internal Worker Endpoints ---

@internal_router.post("/claim")
def claim_review(
    x_internal_secret: str = Header(None, alias="X-Internal-Secret"),
    db: Session = Depends(database.get_db)
):
    if x_internal_secret != INTERNAL_WORKER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    review = db.query(models.Review).filter(models.Review.status == models.ReviewStatus.QUEUED).first()
    
    if not review:
        return {"status": "no_job"}
    
    review.status = models.ReviewStatus.RUNNING
    db.commit()
    db.refresh(review)
    
    pr = review.pull_request
    repo = pr.repository
    
    integration = db.query(models.Integration).filter(
        models.Integration.user_id == repo.user_id,
        models.Integration.provider == repo.provider
    ).first()
    
    token = security.decrypt_token(integration.token_encrypted)
    
    rules = []
    policy_cats = db.query(models.PolicyCategory).filter(models.PolicyCategory.user_id == repo.user_id).all()
    for cat in policy_cats:
        for rule in cat.rules:
            if rule.enabled:
                rules.append({"name": rule.name, "severity": rule.severity, "rule_text": rule.rule_text})

    return {
        "status": "job_claimed",
        "job": {
            "review_id": review.id,
            "provider": repo.provider,
            "repo_full_name": repo.repo_full_name,
            "pr_number": pr.pr_external_id,
            "token": token,
            "policies": rules
        }
    }

@internal_router.post("/{review_id}/result")
def submit_result(
    review_id: int,
    result: schemas.ReviewResult,
    x_internal_secret: str = Header(None, alias="X-Internal-Secret"),
    db: Session = Depends(database.get_db)
):
    if x_internal_secret != INTERNAL_WORKER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.status = result.status
    review.summary = result.summary
    
    repo = review.pull_request.repository
    user_id = repo.user_id

    for v in result.violations:
        cat_id = None
        if v.category:
            cat_obj = db.query(models.PolicyCategory).filter(
                models.PolicyCategory.user_id == user_id,
                models.PolicyCategory.name == v.category
            ).first()
            if cat_obj:
                cat_id = cat_obj.id

        rule_id = None
        if v.rule_name and cat_id:
             rule_obj = db.query(models.PolicyRule).filter(
                models.PolicyRule.category_id == cat_id,
                models.PolicyRule.name == v.rule_name
            ).first()
             if rule_obj:
                 rule_id = rule_obj.id

        severity_map = {
            "CRITICAL": 5,
            "HIGH": 4,
            "MEDIUM": 3,
            "WARNING": 3,
            "LOW": 2,
            "INFO": 1
        }
        severity_str = (v.severity or "INFO").upper()
        severity_int = severity_map.get(severity_str, 1)

        violation = models.ReviewViolation(
            review_id=review.id,
            policy_category_id=cat_id,
            policy_rule_id=rule_id,
            severity=severity_int,
            file_path=v.file_path,
            line_start=v.line_start,
            line_end=v.line_end,
            message=v.message
        )
        db.add(violation)
        
    db.commit()
    return {"status": "ok"}
