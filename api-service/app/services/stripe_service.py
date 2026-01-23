import stripe
import os
from fastapi import HTTPException
from typing import Optional

class StripeService:
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.frontend_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
        
        if not self.api_key:
            print("Warning: STRIPE_SECRET_KEY not set")
        
        stripe.api_key = self.api_key

    def create_customer(self, user_email: str, user_id: str) -> str:
        """Create a Stripe customer or return existing one if found (by email search usually, but we store ID)"""
        # Ideally we store ID, but if we don't have it yet:
        try:
            # Search by email first to avoid duplicates if DB was wiped but Stripe wasn't
            existing = stripe.Customer.list(email=user_email, limit=1)
            if existing.data:
                return existing.data[0].id
            
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"user_id": user_id}
            )
            return customer.id
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    def create_checkout_session(self, customer_id: str, price_id: str, extra_repos: int = 0, trial_days: int = 7) -> str:
        """Create a Checkout Session for a subscription."""
        try:
            line_items = [
                {"price": price_id, "quantity": 1},
            ]
            
            # Add-on for extra repos
            if extra_repos > 0:
                extra_repo_price = os.getenv("STRIPE_PRICE_EXTRA_REPO_MONTHLY")
                if extra_repo_price:
                    line_items.append({"price": extra_repo_price, "quantity": extra_repos})
            
            subscription_data = {
                "metadata": {"extra_repos": str(extra_repos)} # Pass metadata to subscription
            }
            
            if trial_days > 0:
                subscription_data["trial_period_days"] = trial_days

            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                mode="subscription",
                line_items=line_items,
                success_url=f"{self.frontend_url}/dashboard/billing?success=true",
                cancel_url=f"{self.frontend_url}/dashboard/billing?canceled=true",
                subscription_data=subscription_data,
                allow_promotion_codes=True,
            )
            return checkout_session.url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Checkout creation failed: {str(e)}")

    def upgrade_subscription(self, subscription_id: str, new_price_id: str, extra_repos: int = 0) -> str:
        """
        Upgrade subscription immediately.
        If current subscription is canceled, creates a new checkout session instead without trial.
        """
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            
            # 1. Handle Canceled State
            if sub.status == 'canceled':
                # Subscription is dead, create a new one via Checkout
                # No trial, since they are upgrading/re-subscribing
                return self.create_checkout_session(
                    customer_id=sub.customer,
                    price_id=new_price_id,
                    extra_repos=extra_repos,
                    trial_days=0
                )

            # 2. Proceed with Update for Active/Trialing
            items = []
            
            # Find the main plan item and the extra repos item
            # We assume the main plan is the one that is NOT the extra repo price
            extra_price_id = os.getenv("STRIPE_PRICE_EXTRA_REPO_MONTHLY")
            
            # Identify items to modify or delete
            main_item_id = None
            extra_item_id = None
            
            for item in sub['items']['data']:
                price = item['price']['id']
                if price == extra_price_id:
                    extra_item_id = item['id']
                else:
                    main_item_id = item['id']
            
            # Prepare modification list
            # 1. Update main plan
            if main_item_id:
                items.append({
                    "id": main_item_id,
                    "price": new_price_id,
                })
            else:
                # Should not happen for active sub, but handle case
                items.append({
                    "price": new_price_id,
                    "quantity": 1
                })
                
            # 2. Update extra repos
            if extra_repos > 0:
                if extra_item_id:
                    items.append({
                        "id": extra_item_id,
                        "quantity": extra_repos
                    })
                else:
                    if extra_price_id:
                        items.append({
                            "price": extra_price_id,
                            "quantity": extra_repos
                        })
            else:
                # If extra_repos is 0 but we had an item, delete it
                if extra_item_id:
                    items.append({
                        "id": extra_item_id,
                        "deleted": True
                    })

            # Perform update
            # proration_behavior='always_invoice' ensures we calculate diff and charge immediately
            updated_sub = stripe.Subscription.modify(
                subscription_id,
                items=items,
                trial_end='now', # End trial immediately
                cancel_at_period_end=False, # Reactivate if it was set to cancel
                proration_behavior='always_invoice',
                metadata={"extra_repos": str(extra_repos)}
            )
            
            # Check for latest invoice
            if updated_sub.latest_invoice:
                invoice = stripe.Invoice.retrieve(updated_sub.latest_invoice)
                # Removed payment_intent check as it causes API error and we just need the URL
                
                if invoice.hosted_invoice_url and invoice.status == 'open':
                    return invoice.hosted_invoice_url
            
            return None

        except Exception as e:
            # Fallback: if "canceled subscription" error occurs, it means the sub is effectively dead.
            # Create a new checkout.
            error_msg = str(e).lower()
            print(f"Upgrade subscription failed: {e}")
            
            if "canceled" in error_msg or "active" in error_msg: 
                 try:
                     print("Attempting fallback to new checkout session...")
                     # If we have sub object from earlier
                     if 'sub' in locals() and sub:
                         return self.create_checkout_session(
                            customer_id=sub.customer,
                            price_id=new_price_id,
                            extra_repos=extra_repos,
                            trial_days=0
                        )
                 except Exception as inner_e:
                     print(f"Fallback checkout failed: {inner_e}")
            
            raise HTTPException(status_code=500, detail=f"Upgrade failed: {str(e)}")

    def create_portal_session(self, customer_id: str) -> str:
        """Create a Customer Portal session."""
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=f"{self.frontend_url}/dashboard/billing",
            )
            return portal_session.url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Portal creation failed: {str(e)}")
            
    def get_subscription(self, subscription_id: str):
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve subscription: {str(e)}")

    def construct_event(self, payload: bytes, sig_header: str):
        """Verify and return the webhook event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")

stripe_service = StripeService()
