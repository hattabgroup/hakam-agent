from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from . import models

class User(BaseModel):
    id: int
    auth_user_id: str
    email: str
    
    class Config:
        from_attributes = True

class IntegrationCreate(BaseModel):
    provider: str
    token: str

class IntegrationUpdate(BaseModel):
    token: str

class IntegrationResponse(BaseModel):
    id: int
    provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Repository(BaseModel):
    repo_external_id: str
    repo_full_name: str
    is_enabled: bool = True
    integration_id: Optional[int] = None

class RepositoryCreate(BaseModel):
    provider: str
    integration_id: int
    repos: List[Repository]

class RepositoryResponse(BaseModel):
    id: int
    provider: str
    integration_id: int
    repo_external_id: str
    repo_full_name: str
    is_enabled: bool
    
    class Config:
        from_attributes = True

# Review Schemas
class ReviewRunRequest(BaseModel):
    # Option A: repo_id, pr_number
    repo_id: int = None
    pr_number: str
    
    # Option B: provider, repo_full_name, pr_number (Not fully implemented in routes for simplicity, will focus on Option A)

class PolicyCategoryResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class PolicyRuleResponse(BaseModel):
    id: int
    name: str
    severity: int
    class Config:
        from_attributes = True

class ReviewViolation(BaseModel):
    policy_category: Optional[PolicyCategoryResponse] = None
    policy_rule: Optional[PolicyRuleResponse] = None
    severity: Optional[int] = None
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    message: str
    
    class Config:
        from_attributes = True

class PullRequest(BaseModel):
    id: int
    repo_id: int
    pr_external_id: str
    author: Optional[str] = None
    title: Optional[str] = None
    repository: RepositoryResponse # Include repository details

    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    pr_id: int
    status: str
    summary: Optional[str]
    created_at: datetime
    published_at: Optional[datetime]
    violations: List[ReviewViolation] = []
    pull_request: PullRequest = None
    
    class Config:
        from_attributes = True

class ReviewViolationCreate(BaseModel):
    category: Optional[str] = None
    rule_name: Optional[str] = None
    severity: Optional[str] = None # Input is still string from Agent
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    message: str

class ReviewResult(BaseModel):
    status: models.ReviewStatus # done, failed
    summary: str
    violations: List[ReviewViolationCreate]

class ReviewPublishRequest(BaseModel):
    dry_run: bool

class DashboardReviewSummary(BaseModel):
    repo: str
    status: str
    score: str
    date: str # e.g. "2h ago"

class DashboardStatsResponse(BaseModel):
    active_repos: int
    active_repos_change: str
    quality_score: str
    quality_score_change: str
    critical_issues: int
    critical_issues_change: str
    critical_issues: int
    critical_issues_change: str
    recent_reviews: List[DashboardReviewSummary]

class SettingsItem(BaseModel):
    key: str
    value: str

class SettingsUpdate(BaseModel):
    settings: List[SettingsItem]
