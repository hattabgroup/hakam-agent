from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class ReviewStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"

class Severity(enum.IntEnum):
    INFO = 1
    LOW = 2
    MEDIUM = 3 # Warning
    HIGH = 4
    CRITICAL = 5

class UserLocal(Base):
    """Local cache/reference of user to map ownership."""
    __tablename__ = "api_users"
    
    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    integrations = relationship("Integration", back_populates="user")
    repositories = relationship("Repository", back_populates="user")
    policy_categories = relationship("PolicyCategory", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)

    # Stripe mapping
    stripe_customer_id = Column(String(255), nullable=True, index=True)

class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("api_users.id"), nullable=False)
    provider = Column(String(50), nullable=False) # github, gitlab, bitbucket
    token_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserLocal", back_populates="integrations")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("api_users.id"), nullable=False)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=False)
    provider = Column(String(50), nullable=False)
    repo_external_id = Column(String(255), nullable=False)
    repo_full_name = Column(String(255), nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserLocal", back_populates="repositories")
    integration = relationship("Integration")
    pull_requests = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")

class PolicyCategory(Base):
    __tablename__ = "policy_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("api_users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserLocal", back_populates="policy_categories")
    rules = relationship("PolicyRule", back_populates="category", cascade="all, delete-orphan")

class PolicyRule(Base):
    __tablename__ = "policy_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("policy_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    severity = Column(Integer, default=Severity.MEDIUM) # 1=Info, 5=Critical
    rule_text = Column(Text, nullable=False) # The pattern to match
    enabled = Column(Boolean, default=True)

    category = relationship("PolicyCategory", back_populates="rules")

class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    pr_external_id = Column(String(255), nullable=False) # PR number
    title = Column(String(255), nullable=True)
    author = Column(String(255), nullable=True)
    last_seen_sha = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    repository = relationship("Repository", back_populates="pull_requests")
    reviews = relationship("Review", back_populates="pull_request", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("pull_requests.id"), nullable=False)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.QUEUED)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    provider_comment_id = Column(String(255), nullable=True)

    pull_request = relationship("PullRequest", back_populates="reviews")
    violations = relationship("ReviewViolation", back_populates="review", cascade="all, delete-orphan")

class ReviewViolation(Base):
    __tablename__ = "review_violations"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    
    # Relations
    policy_category_id = Column(Integer, ForeignKey("policy_categories.id"), nullable=True)
    policy_rule_id = Column(Integer, ForeignKey("policy_rules.id"), nullable=True)
    
    # Snapshots (optional, or we rely on relations)
    # Keeping severity/message/file_path as they are specific to the violation instance
    severity = Column(Integer, nullable=True) # Snapshot of severity at time of review
    file_path = Column(String(1024), nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)

    review = relationship("Review", back_populates="violations")
    policy_category = relationship("PolicyCategory")
    policy_rule = relationship("PolicyRule")

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("api_users.id"), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=True)
    
    # We want uniqueness per user+key
    # Note: In a real migration we'd add UniqueConstraint('user_id', 'key', name='_user_key_uc')

    user = relationship("UserLocal")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("api_users.id"), unique=True, nullable=False)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    stripe_customer_id = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False) # active, trialing, past_due, canceled, incomplete
    
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    
    plan_price_id = Column(String(255), nullable=True)
    extra_repos_quantity = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("UserLocal", back_populates="subscription")

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    duration_days = Column(Integer, default=7)
    is_redeemed = Column(Boolean, default=False)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    redeemed_by_user_id = Column(Integer, ForeignKey("api_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    stripe_event_id = Column(String(255), unique=True, nullable=False)
    type = Column(String(255), nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

