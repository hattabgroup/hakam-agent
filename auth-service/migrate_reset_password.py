import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def run_migration():
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        print("Adding reset_password_token column...")
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL"))
            print("Successfully added reset_password_token column.")
        except Exception as e:
            print(f"Could not add reset_password_token column (it may already exist): {e}")

        print("Adding reset_password_expires_at column...")
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_password_expires_at DATETIME DEFAULT NULL"))
            print("Successfully added reset_password_expires_at column.")
        except Exception as e:
            print(f"Could not add reset_password_expires_at column (it may already exist): {e}")
            
    print("Migration completed.")

if __name__ == "__main__":
    run_migration()
