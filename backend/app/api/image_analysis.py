from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.image_analysis import ImageAnalysisResponse
from app.services.image_analysis import (
    create_image_analysis,
    get_image_analyses,
    get_image_analysis_by_id,
    delete_image_analysis,
)

router = APIRouter()


@router.post("/", response_model=ImageAnalysisResponse)
async def upload_and_analyze(
    file: UploadFile = File(..., description="Yiyecek/içecek görseli (JPG, PNG, HEIC, WebP — maks 10MB)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Görsel yükler ve Gemini Vision API ile analiz eder.

    Desteklenen kategoriler:
    - **food**: Yemek görselleri → kalori, besin değerleri tahmini
    - **drink**: İçecek görselleri → kalori, kafein tahmini
    - **other**: Diğer görseller → genel açıklama
    """
    return await create_image_analysis(db, current_user.id, file)


@router.get("/", response_model=list[ImageAnalysisResponse])
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kullanıcının tüm görsel analizlerini listeler."""
    return await get_image_analyses(db, current_user.id)


@router.get("/{analysis_id}", response_model=ImageAnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir görsel analizi getirir."""
    return await get_image_analysis_by_id(db, current_user.id, analysis_id)


@router.delete("/{analysis_id}", status_code=204)
async def remove_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Görsel analizi ve dosyasını siler."""
    await delete_image_analysis(db, current_user.id, analysis_id)
