from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.health_data import router as health_data_router
from app.api.image_analysis import router as image_analysis_router
from app.api.symptom import router as symptom_router

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
app.include_router(health_data_router, prefix="/api/v1/health-data", tags=["Health Data"])
app.include_router(image_analysis_router, prefix="/api/v1/image-analysis", tags=["Image Analysis"])
app.include_router(symptom_router, prefix="/api/v1/symptoms", tags=["Symptoms"])

# Yüklenen görsellere erişim için static file serving
uploads_dir = Path("uploads/images")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {"message": "MindTrack API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
