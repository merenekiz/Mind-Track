import json
import os
from pathlib import Path

import google.generativeai as genai
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.image_analysis import ImageAnalysis

# Gemini yapılandırması
genai.configure(api_key=settings.GEMINI_API_KEY)

# Yüklenen dosyaların kaydedileceği klasör
UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_upload_file(file: UploadFile, user_id: int) -> str:
    """Yüklenen dosyayı diske kaydeder, dosya yolunu döner."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Desteklenmeyen dosya formatı: {ext}. Desteklenen: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dosya boyutu 10 MB sınırını aşıyor",
        )

    user_dir = UPLOAD_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    import uuid
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = user_dir / filename
    file_path.write_bytes(content)

    return str(file_path)


async def analyze_image_with_gemini(file_path: str) -> dict:
    """Gemini Vision API ile görseli analiz eder."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API anahtarı yapılandırılmamış",
        )

    model = genai.GenerativeModel("gemini-1.5-pro")

    # Görseli oku
    image_data = Path(file_path).read_bytes()
    ext = Path(file_path).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".heic": "image/heic",
        ".webp": "image/webp",
    }
    mime_type = mime_map.get(ext, "image/jpeg")

    prompt = """Bu görseli analiz et ve aşağıdaki JSON formatında yanıt ver.
Yanıtın SADECE geçerli JSON olmalı, başka metin ekleme.

{
  "category": "food" veya "drink" veya "other",
  "item_name": "yiyecek veya içeceğin adı (Türkçe)",
  "estimated_calories": tahmini kalori (kcal, sayı),
  "caffeine_mg": kafein miktarı (mg, sadece içecekler için, yoksa null),
  "nutrients": {
    "protein_g": tahmini protein (gram),
    "carb_g": tahmini karbonhidrat (gram),
    "fat_g": tahmini yağ (gram),
    "fiber_g": tahmini lif (gram)
  },
  "description": "kısa Türkçe açıklama (1-2 cümle)",
  "health_notes": "sağlıkla ilgili kısa not veya öneri (Türkçe)"
}

Eğer görsel yiyecek veya içecek değilse:
{
  "category": "other",
  "item_name": "görselin kısa tanımı",
  "estimated_calories": null,
  "caffeine_mg": null,
  "nutrients": null,
  "description": "görselin Türkçe açıklaması",
  "health_notes": null
}"""

    response = model.generate_content(
        [
            {"mime_type": mime_type, "data": image_data},
            prompt,
        ]
    )

    # JSON parse
    text = response.text.strip()
    # Gemini bazen ```json ... ``` ile sarar
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        result = {
            "category": "other",
            "item_name": "Analiz yapılamadı",
            "estimated_calories": None,
            "caffeine_mg": None,
            "nutrients": None,
            "description": text[:500],
            "health_notes": None,
        }

    return result


async def create_image_analysis(
    db: AsyncSession, user_id: int, file: UploadFile
) -> ImageAnalysis:
    """Görseli yükler, Gemini ile analiz eder, sonucu veritabanına kaydeder."""
    # 1. Dosyayı kaydet
    file_path = await save_upload_file(file, user_id)

    # 2. Gemini Vision ile analiz et
    analysis_result = await analyze_image_with_gemini(file_path)

    # 3. Veritabanına kaydet
    category = analysis_result.get("category", "other")
    record = ImageAnalysis(
        user_id=user_id,
        file_path=file_path,
        category=category,
        analysis_result=analysis_result,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return record


async def get_image_analyses(db: AsyncSession, user_id: int) -> list[ImageAnalysis]:
    """Kullanıcının tüm görsel analizlerini listeler."""
    result = await db.execute(
        select(ImageAnalysis)
        .where(ImageAnalysis.user_id == user_id)
        .order_by(desc(ImageAnalysis.created_at))
    )
    return list(result.scalars().all())


async def get_image_analysis_by_id(
    db: AsyncSession, user_id: int, analysis_id: int
) -> ImageAnalysis:
    """Belirli bir görsel analizi getirir."""
    result = await db.execute(
        select(ImageAnalysis)
        .where(ImageAnalysis.id == analysis_id, ImageAnalysis.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Görsel analizi bulunamadı",
        )
    return record


async def delete_image_analysis(
    db: AsyncSession, user_id: int, analysis_id: int
) -> None:
    """Görsel analizi siler ve dosyayı kaldırır."""
    record = await get_image_analysis_by_id(db, user_id, analysis_id)

    # Dosyayı diskten sil
    file_path = Path(record.file_path)
    if file_path.exists():
        file_path.unlink()

    await db.delete(record)
    await db.commit()
