from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class GenerateAnalysisRequest(BaseModel):
    """AI analizi tetikleme isteği. Tarih verilmezse bugün kullanılır."""
    date: Optional[date] = None
    days_back: int = Field(7, ge=1, le=30, description="Geriye dönük kaç günün verileri analize dahil edilsin")
    include_rag: bool = True


class Recommendation(BaseModel):
    title: str
    detail: str
    priority: Optional[str] = None  # düşük | orta | yüksek


class ScientificReference(BaseModel):
    pubmed_id: str
    title: str
    similarity: Optional[float] = None


class AIAnalysisResponse(BaseModel):
    id: int
    user_id: int
    date: date
    summary: str
    recommendations: dict[str, Any]
    scientific_references: Optional[dict[str, Any]] = None
    data_used: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
