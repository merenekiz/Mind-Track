from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Any, Literal, Optional


MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class ImageAnalysisResponse(BaseModel):
    id: int
    user_id: int
    health_data_id: Optional[int] = None
    file_path: str
    category: str
    meal_type: Optional[MealType] = None
    analysis_result: dict[str, Any]
    created_at: datetime

    @computed_field  # type: ignore[misc]
    @property
    def image_url(self) -> str:
        """Frontend için tam absolute URL (backend kök adresi ile)."""
        from app.core.config import settings as _s

        backend_url = getattr(_s, "PUBLIC_BACKEND_URL", None) or "http://localhost:8000"

        fp = self.file_path
        if fp.startswith("http://") or fp.startswith("https://"):
            return fp
        # Backend cwd'sinden başlıyor: "uploads/images/7/abc.jpg"
        if fp.startswith("uploads/") or fp.startswith("./uploads/"):
            return f"{backend_url}/{fp.lstrip('./')}"
        if fp.startswith("/uploads/"):
            return f"{backend_url}{fp}"
        # Mutlak local path: "/Users/.../backend/uploads/images/7/abc.jpg"
        # → "uploads/" sonrasını al
        if "/uploads/" in fp:
            sub = fp.split("/uploads/", 1)[1]
            return f"{backend_url}/uploads/{sub}"
        return f"{backend_url}/uploads/{fp.lstrip('/')}"

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
