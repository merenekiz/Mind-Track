from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router

app = FastAPI(
    title="MindTrack API",
    version="1.0.0",
    description="Somatik Belirti & Duygu Analizi Yapan Akıllı Sağlık Günlüğü",
)

# CORS — web ve mobil için
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:8081",  # React Native dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])


@app.get("/")
async def root():
    return {"message": "MindTrack API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
