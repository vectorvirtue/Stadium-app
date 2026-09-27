from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth, matches, payments, profile, tickets, wallet

app = FastAPI(title="Stadiumapp API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(matches.router)
app.include_router(tickets.router)
app.include_router(payments.router)
app.include_router(profile.router)
app.include_router(wallet.router)
app.include_router(admin.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
