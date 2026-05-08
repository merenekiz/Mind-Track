from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ai_analysis import GenerateAnalysisRequest, AIAnalysisResponse
from app.services.ai_analysis import (
    generate_analysis,
    list_analyses,
    get_analysis,
    delete_analysis,
)

router = APIRouter()


@router.post("/generate", response_model=AIAnalysisResponse)
async def generate(
    payload: GenerateAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının son N gününe ait sağlık verisi + semptom + görsel analiz verilerini
    toplar, RAG ile ilgili bilimsel literatürü ekler ve Gemini ile bütünsel
    sağlık yorumu üretir. Sonucu `ai_analysis_results` tablosuna kaydeder.
    """
    target = payload.date or date_type.today()
    return await generate_analysis(
        db,
        user_id=current_user.id,
        target_date=target,
        days_back=payload.days_back,
        include_rag=payload.include_rag,
    )


@router.get("/", response_model=list[AIAnalysisResponse])
async def list_all(
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kullanıcının geçmiş AI analizlerini (yeni → eski) listeler."""
    return await list_analyses(db, current_user.id, limit=limit)


@router.get("/{analysis_id}", response_model=AIAnalysisResponse)
async def get_one(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_analysis(db, current_user.id, analysis_id)


@router.delete("/{analysis_id}", status_code=204)
async def remove(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_analysis(db, current_user.id, analysis_id)
