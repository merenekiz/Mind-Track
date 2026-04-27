from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.image_analysis import ImageAnalysisResponse
from app.services.image_analysis import (
    create_image_analysis,
    create_bulk_image_analysis,
    get_image_analyses,
    get_image_analysis_by_id,
    delete_image_analysis,
)

router = APIRouter()

VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}


def _validate_meal_type(meal_type: Optional[str]) -> Optional[str]:
    if meal_type in (None, ""):
        return None
    if meal_type not in VALID_MEAL_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geçersiz meal_type. Beklenen: {sorted(VALID_MEAL_TYPES)}",
        )
    return meal_type


@router.post("/", response_model=ImageAnalysisResponse)
async def upload_and_analyze(
    file: UploadFile = File(..., description="Yiyecek/içecek görseli (JPG, PNG, HEIC, WebP — maks 10MB)"),
    meal_type: Optional[str] = Form(None, description="breakfast | lunch | dinner | snack"),
    health_data_id: Optional[int] = Form(None, description="Bağlı günlük kayıt ID'si"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Görsel yükler ve Gemini Vision API ile analiz eder.

    Opsiyonel `meal_type` ile öğüne göre etiketlenir (kahvaltı/öğle/akşam/atıştırmalık).
    Opsiyonel `health_data_id` ile günlük kayıt ile ilişkilendirilir.
    """
    return await create_image_analysis(
        db, current_user.id, file,
        meal_type=_validate_meal_type(meal_type),
        health_data_id=health_data_id,
    )


@router.post("/bulk", response_model=list[ImageAnalysisResponse])
async def bulk_upload_and_analyze(
    files: list[UploadFile] = File(..., description="Birden fazla yiyecek/içecek görseli"),
    meal_type: Optional[str] = Form(None, description="Tüm görseller için ortak öğün etiketi"),
    health_data_id: Optional[int] = Form(None, description="Tümünü bağlanacak günlük kayıt ID'si"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Birden fazla görseli toplu yükler ve sırayla Gemini Vision API ile analiz eder.

    Tüm görsellere aynı `meal_type` ve `health_data_id` uygulanır (öğün bazlı yükleme için).
    """
    return await create_bulk_image_analysis(
        db, current_user.id, files,
        meal_type=_validate_meal_type(meal_type),
        health_data_id=health_data_id,
    )


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
