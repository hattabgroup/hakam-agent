import os
from .. import models

class EntitlementsService:
    def __init__(self):
        self.starter_price = os.getenv("STRIPE_PRICE_STARTER_MONTHLY")
        self.team_price = os.getenv("STRIPE_PRICE_TEAM_MONTHLY")
        self.business_price = os.getenv("STRIPE_PRICE_BUSINESS_MONTHLY")
        
        self.starter_yearly = os.getenv("STRIPE_PRICE_STARTER_YEARLY")
        self.team_yearly = os.getenv("STRIPE_PRICE_TEAM_YEARLY")
        self.business_yearly = os.getenv("STRIPE_PRICE_BUSINESS_YEARLY")
        
        # Base limits
        self.limits = {
            self.starter_price: 3,
            self.starter_yearly: 3,
            
            self.team_price: 10,
            self.team_yearly: 10,
            
            self.business_price: 30,
            self.business_yearly: 30
        }

    def is_billing_enabled(self) -> bool:
        return os.getenv("BILLING_ENABLED", "false").lower() in ("true", "1", "yes")

    def get_repo_limit(self, subscription: models.Subscription) -> int:
        # If billing is disabled (Community / Open-Source edition), allow unlimited repositories
        if not self.is_billing_enabled():
            return 999999

        if not subscription or subscription.status not in ["active", "trialing"]:
            return 0
        
        base = self.limits.get(subscription.plan_price_id, 0)
        return base + (subscription.extra_repos_quantity or 0)

entitlements_service = EntitlementsService()
