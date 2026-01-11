from fastapi import FastAPI
from . import models, database, routes

# Create tables on startup (simplest for Phase 2, usually use Alembic)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Hakam Auth Service", version="0.1.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Phase 2 dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth-service"}
