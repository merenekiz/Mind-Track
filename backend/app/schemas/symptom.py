from datetime import date as date_type, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class SymptomCreate(BaseModel):
    """Kullanıcının yazdığı semptom metni"""
    text: str = Field(..., min_length=3, max_length=2000, description="Semptom metni (Türkçe)")
    date: Optional[date_type] = None  # Belirtilmezse bugün

    @field_validator("date", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v


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
    date: date_type
    created_at: datetime

    model_config = {"from_attributes": True}
