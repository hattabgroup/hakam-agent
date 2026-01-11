from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from .. import schemas, security, models, database
from ..services.mcp_client import mcp_client
import os

router = APIRouter(prefix="/reviews", tags=["reviews"])
internal_router = APIRouter(prefix="/internal/reviews", tags=["internal"])

INTERNAL_WORKER_SECRET = os.getenv("INTERNAL_WORKER_SECRET")

# --- User Endpoints ---

@router.post("/run", response_model=schemas.ReviewResponse)
def run_review(
    request: schemas.ReviewRunRequest,
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
    # Get last 5 reviews (any status, but preferably DONE or FAILED to show history)
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
            
            # Simple status logic
            if crit > 0: 
                status_text = "Critical" # Need handling in frontend? Default UI had "Warning", "Clean", "Safe"
                # Map to UI expectations roughly
                # Clean (Green), Warning (Amber), Issue (Blue)
                # Let's use: Clean, Warning (if high/crit), Issues (if others)
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
        active_repos_change="", # Placeholder
        quality_score=f"{avg_score}%",
        quality_score_change="", # Placeholder
        critical_issues=total_critical,
        critical_issues_change="", # Placeholder
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
    
    # Build summary body
    body = f"## Hakam Review Summary\n\n{review.summary or 'No summary provided.'}\n\n"
    if not review.violations:
        body += "No violations found. LGTM! 🚀"

    if not request.dry_run:
        # Decrypt token
        integration = db.query(models.Integration).filter(
            models.Integration.user_id == current_user.id,
            models.Integration.provider == review.pull_request.repository.provider
        ).first()
        
        if not integration:
            raise HTTPException(status_code=400, detail="Integration not found for publishing")
            
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
            raise HTTPException(status_code=500, detail=str(e))

    review.published_at = datetime.utcnow() # Use datetime.utcnow()
    db.commit()
    db.refresh(review)
    return review


# --- Internal Worker Endpoints ---

@internal_router.post("/claim")
def claim_review(
    x_internal_secret: str = Header(None, alias="X-Internal-Secret"),
    db: Session = Depends(database.get_db)
):
    if x_internal_secret != INTERNAL_WORKER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Atomic claim attempt (simplest way: select for update or simple UPDATE + SELECT)
    # Using simple logic for Phase 2: Find first queued, update to running
    review = db.query(models.Review).filter(models.Review.status == models.ReviewStatus.QUEUED).first()
    
    if not review:
        return {"status": "no_job"}
    
    review.status = models.ReviewStatus.RUNNING
    db.commit()
    db.refresh(review)
    
    # Return context needed for agent
    pr = review.pull_request
    repo = pr.repository
    
    # Get integration token (needed by agent to fetch diff)
    integration = db.query(models.Integration).filter(
        models.Integration.user_id == repo.user_id,
        models.Integration.provider == repo.provider
    ).first()
    
    token = security.decrypt_token(integration.token_encrypted)
    
    # Get Policies
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
    
    # Prepare for ID lookup
    # Need repo -> user to lookup matching policies
    repo = review.pull_request.repository
    user_id = repo.user_id # Assuming accessible via relationships

    # Save violations
    for v in result.violations:
        # Lookup Category ID
        cat_id = None
        if v.category:
            cat_obj = db.query(models.PolicyCategory).filter(
                models.PolicyCategory.user_id == user_id,
                models.PolicyCategory.name == v.category
            ).first()
            if cat_obj:
                cat_id = cat_obj.id

        # Lookup Rule ID
        rule_id = None
        if v.rule_name and cat_id:
             rule_obj = db.query(models.PolicyRule).filter(
                models.PolicyRule.category_id == cat_id,
                models.PolicyRule.name == v.rule_name
            ).first()
             if rule_obj:
                 rule_id = rule_obj.id

        # Map severity string to int
        severity_map = {
            "CRITICAL": 5,
            "HIGH": 4,
            "MEDIUM": 3,
            "WARNING": 3,
            "LOW": 2,
            "INFO": 1
        }
        severity_str = (v.severity or "INFO").upper()
        severity_int = severity_map.get(severity_str, 1) # Default to INFO

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
