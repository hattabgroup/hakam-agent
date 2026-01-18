from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, distinct
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from .. import database, models, security

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/authors", response_model=List[str])
def get_authors(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    """
    Get unique authors from pull requests associated with the user's repositories.
    """
    # Join PullRequest -> Repository -> UserLocal
    # Filter by user_id
    authors = (
        db.query(distinct(models.PullRequest.author))
        .join(models.Repository, models.PullRequest.repo_id == models.Repository.id)
        .filter(models.Repository.user_id == current_user.id)
        .filter(models.PullRequest.author.isnot(None))
        .all()
    )
    
    # authors is a list of tuples like [('author1',), ('author2',)]
    return [a[0] for a in authors if a[0]]

@router.get("/violations")
def get_violations_report(
    author: Optional[str] = None,
    repo_ids: Optional[List[int]] = Query(None),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    """
    Get violations report filtered by author, repositories, and date range.
    Returns summary stats and a detailed list of violations.
    """
    
    # Base query: ReviewViolation -> Review -> PullRequest -> Repository
    # We need to filter ensuring the repository belongs to the current user
    query = (
        db.query(models.ReviewViolation)
        .join(models.Review, models.ReviewViolation.review_id == models.Review.id)
        .join(models.PullRequest, models.Review.pr_id == models.PullRequest.id)
        .join(models.Repository, models.PullRequest.repo_id == models.Repository.id)
        .filter(models.Repository.user_id == current_user.id)
    )
    
    # Apply filters
    if author:
        query = query.filter(models.PullRequest.author == author)
    
    if repo_ids:
        query = query.filter(models.Repository.id.in_(repo_ids))
        
    if start_date:
        # Assuming we filter by Review creation date or Violation creation? 
        # ReviewViolation doesn't have created_at, so use Review.created_at
        query = query.filter(func.date(models.Review.created_at) >= start_date)
        
    if end_date:
        query = query.filter(func.date(models.Review.created_at) <= end_date)

    # Execute query for list
    # We might want to limit this if it's too large, but request says "count ... categories list ... with full details"
    # Let's verify what "full details" means. 
    # For the list, we probably want to eager load relationships if needed, or just return the fields.
    # The user wants "list of violations with i full details about it and if i click on one of them it will open the review details page"
    
    violations_models = query.order_by(desc(models.Review.created_at)).limit(1000).all() # Cap at 1000 for safety?
    
    # Process for summary
    # We can do this in Python or separate SQL queries. 
    # Doing in Python avoids re-running the value match logic if complex, but SQL is faster for aggregates.
    # Since we fetched the models, let's just aggregate in python for simplicity unless performance is issue.
    # Actually, fetching 1000 items is fine.
    
    # Severity Map (Int -> String) if needed, or just return Int.
    # The UI asks for "author categories by sevirty and categories".
    # I assume "categories by severity" implies breaking down violations by severity.
    # And "categories" probably refers to Policy Category.
    
    by_severity = {}
    by_category = {}
    
    violations_data = []
    
    for v in violations_models:
        # Severity
        sev = v.severity or 0
        by_severity[sev] = by_severity.get(sev, 0) + 1
        
        # Category
        cat_name = "Uncategorized"
        if v.policy_category:
            cat_name = v.policy_category.name
        elif v.policy_rule and v.policy_rule.category:
             cat_name = v.policy_rule.category.name
             
        by_category[cat_name] = by_category.get(cat_name, 0) + 1
        
        # Detail object
        violations_data.append({
            "id": v.id,
            "review_id": v.review_id,
            "file_path": v.file_path,
            "line_start": v.line_start,
            "line_end": v.line_end,
            "message": v.message,
            "severity": v.severity,
            "category": cat_name,
            "created_at": v.review.created_at,
            "pr_id": v.review.pull_request.id,
            "pr_title": v.review.pull_request.title,
            "author": v.review.pull_request.author,
            "repo_name": v.review.pull_request.repository.repo_full_name
        })

    return {
        "summary": {
            "by_severity": by_severity,
            "by_category": by_category,
            "total": len(violations_models)
        },
        "violations": violations_data
    }
