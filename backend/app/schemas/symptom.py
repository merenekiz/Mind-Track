from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SymptomCreate(BaseModel):
    """Kullanıcının yazdığı semptom metni"""
    text: str = Field(..., min_length=3, max_length=2000, description="Semptom metni (Türkçe)")
    date: Optional[date] = None  # Belirtilmezse bugün


class DetectedSymptom(BaseModel):
    """Gemini'nin tespit ettiği tek bir semptom"""
    name: str  # baş ağrısı, mide bulantısı vb.
    severity: Optional[str] = None  # hafif, orta, şiddetli
    body_region: Optional[str] = None  # baş, mide, sırt vb.
    duration: Optional[str] = None  # birkaç saat, sabahtan beri vb.


class SymptomAnalysisResult(BaseModel):
    """Gemini'nin yapılandırılmış semptom analizi"""
    symptoms: list[DetectedSymptom]
    summary: str  # kısa özet
    suggested_categories: list[str] = []  # nörolojik, gastrointestinal vb.


class SymptomResponse(BaseModel):
    id: int
    user_id: int
    original_text: str
    detected_symptoms: dict[str, Any]
    date: date
    created_at: datetime

    model_config = {"from_attributes": True}
