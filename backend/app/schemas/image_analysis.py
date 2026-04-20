from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional


class ImageAnalysisResponse(BaseModel):
    id: int
    user_id: int
    file_path: str
    category: str
    analysis_result: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class ImageAnalysisSummary(BaseModel):
    """Gemini Vision analiz sonucu yapısı"""
    category: str  # food, drink, other
    item_name: str  # yemek/içecek adı
    estimated_calories: Optional[float] = None
    caffeine_mg: Optional[float] = None
    nutrients: Optional[dict[str, Any]] = None  # protein, carb, fat vb.
    description: str  # kısa açıklama
    health_notes: Optional[str] = None  # sağlıkla ilgili notlar
