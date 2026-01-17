from fastapi import FastAPI
from . import database, models
from .routes import users, integrations, repositories, policies, reviews, webhooks

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Phase 2: Auto-migration for integration_id
from sqlalchemy import text
with database.engine.connect() as conn:
    try:
        # Check if column exists by attempting to select it
        conn.execute(text("SELECT integration_id FROM repositories LIMIT 1"))
    except Exception:
        # Column missing, attempt to add it
        try:
            print("Auto-migrating: Adding missing 'integration_id' to repositories table...")
            conn.execute(text("ALTER TABLE repositories ADD COLUMN integration_id INT"))
            # Note: We keep it nullable for existing rows, but the app logic will handle new ones correctly.
            conn.commit()
        except Exception as e:
            print(f"Auto-migration failed for repositories: {e}")

    # Auto-migration for Review Violations (Phase 2 Refactor)
    try:
        conn.execute(text("SELECT policy_category_id FROM review_violations LIMIT 1"))
    except Exception:
        try:
            print("Auto-migrating: Adding missing policy relations to review_violations table...")
            conn.execute(text("ALTER TABLE review_violations ADD COLUMN policy_category_id INT NULL"))
            conn.execute(text("ALTER TABLE review_violations ADD COLUMN policy_rule_id INT NULL"))
             # We can try add constraints, but ignore if fail (might need to create indexes explicitly first in some mysql versions, but basic ADD COLUMN is most critical)
            try: 
                 conn.execute(text("ALTER TABLE review_violations ADD CONSTRAINT fk_rv_pc FOREIGN KEY (policy_category_id) REFERENCES policy_categories(id)"))
                 conn.execute(text("ALTER TABLE review_violations ADD CONSTRAINT fk_rv_pr FOREIGN KEY (policy_rule_id) REFERENCES policy_rules(id)"))
            except Exception as e:
                 print(f"Warning: Could not add FK constraints: {e}")
            
            conn.commit()
            print("Auto-migration for review_violations completed.")
        except Exception as e:
            print(f"Auto-migration failed for review_violations: {e}")

    # Auto-migration for Severity Refactor (String -> Int)
    try:
        # Check type of severity column in review_violations (simplistic check: try valid int insert or rely on exception during alter?)
        # Better: Just run updates then alter. If already int, updates might act differently but harmless if we map 'CRITICAL' to 5.
        
        print("Auto-migrating: Converting Severities to Integers...")
        
        # 1. Map String values to Digits for review_violations
        conn.execute(text("UPDATE review_violations SET severity='5' WHERE severity LIKE 'CRITICAL'"))
        conn.execute(text("UPDATE review_violations SET severity='4' WHERE severity LIKE 'HIGH'"))
        conn.execute(text("UPDATE review_violations SET severity='3' WHERE severity LIKE 'MEDIUM' OR severity LIKE 'WARNING'"))
        conn.execute(text("UPDATE review_violations SET severity='2' WHERE severity LIKE 'LOW'"))
        conn.execute(text("UPDATE review_violations SET severity='1' WHERE severity LIKE 'INFO' OR severity IS NULL OR severity NOT IN ('1','2','3','4','5')"))
        
        # 2. Map String values to Digits for policy_rules
        conn.execute(text("UPDATE policy_rules SET severity='5' WHERE severity LIKE 'CRITICAL'"))
        conn.execute(text("UPDATE policy_rules SET severity='4' WHERE severity LIKE 'HIGH'"))
        conn.execute(text("UPDATE policy_rules SET severity='3' WHERE severity LIKE 'MEDIUM' OR severity LIKE 'WARNING'"))
        conn.execute(text("UPDATE policy_rules SET severity='2' WHERE severity LIKE 'LOW'"))
        conn.execute(text("UPDATE policy_rules SET severity='1' WHERE severity LIKE 'INFO' OR severity IS NULL OR severity NOT IN ('1','2','3','4','5')"))

        conn.commit()
        
        # 3. Alter columns to INT
        try:
            conn.execute(text("ALTER TABLE review_violations MODIFY COLUMN severity INT DEFAULT 1"))
            conn.execute(text("ALTER TABLE policy_rules MODIFY COLUMN severity INT DEFAULT 3"))
            conn.commit()
            print("Severity migration completed.")
        except Exception as e:
            # If already INT, this is fine or might fail benignly depending on mysql version/mode
            print(f"Severity ALTER failed (might already be int): {e}")

    except Exception as e:
        print(f"Auto-migration failed for Severity: {e}")

app = FastAPI(title="Hakam API Service", version="0.1.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Phase 2 dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(integrations.router)
app.include_router(repositories.router)
app.include_router(policies.router)
app.include_router(reviews.router)
app.include_router(reviews.internal_router)
from .routes import settings
app.include_router(settings.router)
app.include_router(webhooks.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "api-service"}
