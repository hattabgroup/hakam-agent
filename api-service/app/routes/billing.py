from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from .. import schemas, models, database
from ..services.stripe_service import stripe_service
from ..services.entitlements import entitlements_service
from ..security import get_current_user
import stripe
import os
from datetime import datetime

router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/checkout", response_model=schemas.CheckoutSessionResponse)
def create_checkout_session(
    request: schemas.CheckoutSessionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(get_current_user)
):
    # 1. Get or Create Stripe Customer
    if not current_user.stripe_customer_id:
        customer_id = stripe_service.create_customer(current_user.email, str(current_user.id))
        current_user.stripe_customer_id = customer_id
        db.commit()
    
    # 2. Create Checkout Session
    try:
        url = stripe_service.create_checkout_session(
            current_user.stripe_customer_id,
            request.price_id,
            request.extra_repos
        )
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upgrade")
def upgrade_subscription(
    request: schemas.UpgradeRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(get_current_user)
):
    # Get current active subscription
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.status.in_(["active", "trialing"])
    ).first()
    
    if not sub:
        raise HTTPException(status_code=400, detail="No active subscription to upgrade.")
        
    try:
        url = stripe_service.upgrade_subscription(
            sub.stripe_subscription_id,
            request.price_id,
            request.extra_repos
        )
        return {"url": url, "success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/portal", response_model=schemas.PortalSessionResponse)
def create_portal_session(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(get_current_user)
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found.")
        
    try:
        url = stripe_service.create_portal_session(current_user.stripe_customer_id)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscription", response_model=schemas.SubscriptionMessage)
def get_subscription(
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(get_current_user)
):
    # Fetch subscription from DB
    sub = db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).first()
    
    # Defaults
    plan_name = "Free"
    status = "canceled"
    trial_days = None
    period_end = None
    allowed = 0
    used = 0 # Calculate used repos
    extra = 0
    next_bill = None

    if sub and sub.status in ["active", "trialing"]:
        # Lazy Expiration Check for Promo Codes
        # If the subscription is a promo (starts with promo_) and period has passed, expire it.
        is_promo = str(sub.stripe_subscription_id).startswith("promo_")
        if is_promo and sub.current_period_end:
             # Ensure comparison is timezone-naive UTC
             cpe = sub.current_period_end.replace(tzinfo=None) if sub.current_period_end.tzinfo else sub.current_period_end
             if cpe < datetime.utcnow():
                  print(f"Promo '{sub.stripe_subscription_id}' expired. Canceling...")
                  sub.status = "canceled"
                  db.commit()
                  # Continue to return cancelled status
                  status = "canceled"
                  # Reset plan_name to Free manually or just let it fall through logic?
                  # If status is canceled logic below might need adjustment if it depends on 'status' 
                  # being active to set plan_name.
        
        if sub.status in ["active", "trialing"]:
            # Self-healing: If date is missing, fetch from Stripe
            if not sub.current_period_end and not is_promo:
                try:
                    print(f"Self-healing: Fetching missing data for sub {sub.stripe_subscription_id}")
                    stripe_sub = stripe_service.get_subscription(sub.stripe_subscription_id)
                    sub.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end)
                    db.commit()
                    db.refresh(sub)
                except Exception as e:
                    print(f"Self-healing failed: {e}")

            status = sub.status
            # Determine plan name
            if sub.plan_price_id in [entitlements_service.starter_price, entitlements_service.starter_yearly]:
                plan_name = "Starter"
            elif sub.plan_price_id in [entitlements_service.team_price, entitlements_service.team_yearly]:
                plan_name = "Team"
            elif sub.plan_price_id in [entitlements_service.business_price, entitlements_service.business_yearly]:
                plan_name = "Business"
            else:
                plan_name = "Custom/Unknown"
                
            allowed = entitlements_service.get_repo_limit(sub)
            extra = sub.extra_repos_quantity
            period_end = sub.current_period_end
            next_bill = sub.current_period_end
            
            if sub.status == "trialing" and sub.trial_end:
                delta = sub.trial_end.replace(tzinfo=None) - datetime.utcnow()
                if delta.days >= 0:
                    trial_days = delta.days
    
    # Calculate used repos
    used = db.query(models.Repository).filter(models.Repository.user_id == current_user.id, models.Repository.is_enabled == True).count()

    return {
        "plan_name": plan_name,
        "status": status,
        "trial_days_left": trial_days,
        "current_period_end": period_end,
        "allowed_repos": allowed,
        "used_repos": used,
        "extra_repos_quantity": extra,
        "next_bill_date": next_bill
    }

@router.post("/redeem")
def redeem_promo_code(
    request: schemas.PromoCodeRedeemRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(get_current_user)
):
    from datetime import timedelta
    
    # 1. Validate Promo Code
    promo = db.query(models.PromoCode).filter(models.PromoCode.code == request.code).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid promo code")
        
    if promo.is_redeemed:
        raise HTTPException(status_code=400, detail="Promo code already redeemed")
        
    # 2. Mark as Redeemed
    promo.is_redeemed = True
    promo.redeemed_at = datetime.utcnow()
    promo.redeemed_by_user_id = current_user.id
    
    # 3. Apply Subscription (Business Tier implementation for trial)
    duration = timedelta(days=promo.duration_days)
    new_end_date = datetime.utcnow() + duration
    
    # Assign Business Plan for the trial
    plan_id = entitlements_service.business_price
    
    sub = db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).first()
    if not sub:
        # Create new subscription
        sub = models.Subscription(
            user_id=current_user.id,
            stripe_subscription_id=f"promo_{promo.code}",
            stripe_customer_id=current_user.stripe_customer_id or f"promo_user_{current_user.id}",
            status="active",
            current_period_end=new_end_date,
            plan_price_id=plan_id
        )
        db.add(sub)
    else:
        # Update existing subscription
        sub.stripe_subscription_id = f"promo_{promo.code}"
        sub.status = "active"
        sub.current_period_end = new_end_date
        sub.plan_price_id = plan_id
        sub.cancel_at_period_end = True # Semantically true, it ends after period
    
    db.commit()
    
    return {"status": "success", "message": f"Promo code redeemed! You have Business access until {new_end_date.strftime('%Y-%m-%d')}"}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(database.get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
         event = stripe_service.construct_event(payload, sig_header)
    except Exception as e:
         print(f"Webhook signature verification failed: {e}")
         raise HTTPException(status_code=400, detail="Invalid signature")

    # Idempotency check
    event_id = event["id"]
    if db.query(models.WebhookEvent).filter(models.WebhookEvent.stripe_event_id == event_id).first():
        return {"status": "ignored", "reason": "already_processed"}
    
    # Record event
    try:
        we = models.WebhookEvent(stripe_event_id=event_id, type=event["type"])
        db.add(we)
        db.commit()
    except Exception as e:
        print(f"Failed to save webhook event: {e}")
        # Continue processing anyway? Risk of double processing if we fail to save but succeed to process.
        # Better to fail and let Stripe retry?
        # But if we fail here, we haven't processed logic yet.
        db.rollback()

    # Process logic
    try:
        data = event["data"]["object"]
        event_type = event["type"]
        
        print(f"Processing event: {event_type}")

        if event_type in ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]:
            await handle_subscription_change(data, event_type, db)
        elif event_type in ["invoice.payment_succeeded", "invoice.payment_failed"]:
            await handle_invoice_event(data, event_type, db)
            
        return {"status": "success"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error processing webhook: {e}")
        return {"status": "error", "message": str(e)}

async def handle_subscription_change(sub_data, event_type, db: Session):
    customer_id = sub_data["customer"]
    
    # Find user
    user = db.query(models.UserLocal).filter(models.UserLocal.stripe_customer_id == customer_id).first()
    if not user:
        print(f"User not found for customer {customer_id}")
        return

    # Extract fields
    import json
    try:
        print(f"Subscription keys: {sub_data.keys() if hasattr(sub_data, 'keys') else 'No keys'}")
        print(f"Subscription data: {sub_data}")
    except:
        pass

    status = sub_data.get("status")
    
    # Handle timestamps safely
    cpe = sub_data.get("current_period_end")
    current_period_end = datetime.fromtimestamp(cpe) if cpe else None
    
    te = sub_data.get("trial_end")
    trial_end = datetime.fromtimestamp(te) if te else None
    
    cancel_at_period_end = sub_data.get("cancel_at_period_end", False)
    
    
    # Safely get items
    items_data = sub_data.get("items", {}).get("data", [])
    if items_data and len(items_data) > 0:
         plan_price_id = items_data[0].get("price", {}).get("id")
    else:
         plan_price_id = None
         print("Warning: No items found in subscription")
         
    # Check for extra repos add-on
    extra_repos = 0
    extra_price_id = os.getenv("STRIPE_PRICE_EXTRA_REPO_MONTHLY")
    
    for item in items_data:
        if item.get("price", {}).get("id") == extra_price_id:
            extra_repos = item.get("quantity", 0)
            break
            
    # Update or Create Subscription
    subscription = db.query(models.Subscription).filter(models.Subscription.stripe_subscription_id == sub_data["id"]).first()
    
    if not subscription:
        # Check if user has another subscription? (Assume 1 per user for now)
        subscription = db.query(models.Subscription).filter(models.Subscription.user_id == user.id).first()
        if subscription:
             # Update existing info with new sub ID if it changed (e.g. resubscribe)
             subscription.stripe_subscription_id = sub_data["id"]
        else:
             subscription = models.Subscription(
                 user_id=user.id,
                 stripe_subscription_id=sub_data["id"],
                 stripe_customer_id=customer_id
             )
             db.add(subscription)

    subscription.status = status
    subscription.current_period_end = current_period_end
    subscription.trial_end = trial_end
    subscription.cancel_at_period_end = cancel_at_period_end
    subscription.plan_price_id = plan_price_id
    subscription.extra_repos_quantity = extra_repos
    
    db.commit()
    print(f"Updated subscription for user {user.id} to {status}")

async def handle_invoice_event(invoice_data, event_type, db: Session):
    # Mainly to update status if payment failed, but subscription.updated usually fires too.
    # We can rely on subscription.updated for status changes.
    pass
