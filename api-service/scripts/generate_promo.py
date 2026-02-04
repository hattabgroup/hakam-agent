
import sys
import os
import random
import string
import argparse
from datetime import datetime

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import database, models
from app.database import SessionLocal

def generate_code(length=12):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def create_promo_code(days=7):
    db = SessionLocal()
    try:
        code = generate_code()
        # Ensure uniqueness
        while db.query(models.PromoCode).filter(models.PromoCode.code == code).first():
             code = generate_code()
             
        promo = models.PromoCode(code=code, duration_days=days)
        db.add(promo)
        db.commit()
        print(f"Generated Promo Code: {code}")
        print(f"Duration: {days} days")
        print(f"Expires: {days} days from redemption")
    except Exception as e:
        print(f"Error generating promo code: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a promo code for Hakam")
    parser.add_argument("--days", type=int, default=7, help="Duration of the promo code in days")
    args = parser.parse_args()
    
    create_promo_code(args.days)
