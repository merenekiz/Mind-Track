from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.symptom import SymptomCreate, SymptomResponse
from app.services.symptom import (
    create_symptom,
    get_symptoms,
    get_symptom_by_id,
    delete_symptom,
)

router = APIRouter()


@router.post("/", response_model=SymptomResponse)
async def add_symptom(
    payload: SymptomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının yazdığı semptom metnini Gemini ile analiz eder ve veritabanına kaydeder.

    Çıktı:
    - **detected_symptoms**: Yapılandırılmış semptom listesi, özet ve kategoriler
    - **summary**: Kısa Türkçe özet
    """
    return await create_symptom(db, current_user.id, payload.text, payload.date)


@router.get("/", response_model=list[SymptomResponse])
async def list_symptoms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kullanıcının tüm semptom analizlerini listeler."""
    return await get_symptoms(db, current_user.id)


@router.get("/{symptom_id}", response_model=SymptomResponse)
async def get_symptom(
    symptom_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir semptom kaydını getirir."""
    return await get_symptom_by_id(db, current_user.id, symptom_id)


@router.delete("/{symptom_id}", status_code=204)
async def remove_symptom(
    symptom_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Semptom kaydını siler."""
    await delete_symptom(db, current_user.id, symptom_id)
