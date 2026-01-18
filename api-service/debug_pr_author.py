import os
# Override for local debugging outside docker
os.environ["DATABASE_URL"] = "mysql+pymysql://hakam_user:hakam_password@127.0.0.1/hakam_db"

from app import database, models
from sqlalchemy.orm import Session

db = database.SessionLocal()

try:
    # Check by primary key ID first
    pr_pk = db.query(models.PullRequest).filter(models.PullRequest.id == 15).first()
    print(f"--- Checking PR with PK ID = 15 ---")
    if pr_pk:
        print(f"Found PR (PK=15): ID={pr_pk.id}, ExternalID={pr_pk.pr_external_id}, Author={pr_pk.author}")
    else:
        print("PR with PK ID=15 not found.")

    # Check by external ID just in case user meant that
    pr_ext = db.query(models.PullRequest).filter(models.PullRequest.pr_external_id == "15").first()
    print(f"\n--- Checking PR with External ID = 15 ---")
    if pr_ext:
        print(f"Found PR (ExtID=15): ID={pr_ext.id}, ExternalID={pr_ext.pr_external_id}, Author={pr_ext.author}")
    else:
        print("PR with External ID=15 not found.")

finally:
    db.close()
