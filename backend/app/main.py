from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth_profile, techs, requests, proposals, availability, services, reviews, metrics, admin, wallet

app = FastAPI(title="TechTrust API", version="1.0.0")

# Add CORS middleware BEFORE route handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.23.112.1:3000",  # WSL/Docker host
        "http://172.23.112.1:5173",  # WSL/Docker host (Vite)
        "http://172.23.112.1:8080",  # WSL/Docker host (alt)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)

app.include_router(auth_profile.router)
app.include_router(techs.router)
app.include_router(requests.router)
app.include_router(proposals.router)
app.include_router(availability.router)
app.include_router(services.router)
app.include_router(reviews.router)
app.include_router(metrics.router)
app.include_router(admin.router)
app.include_router(wallet.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "TechTrust API"}
