import asyncio
import io
import json
import logging
import time
import uuid
from datetime import date
from pathlib import Path

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from PIL import Image
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.image_analysis import ImageAnalysis

logger = logging.getLogger(__name__)

# Gemini yapılandırması
genai.configure(api_key=settings.GEMINI_API_KEY)

# Yüklenen dosyaların kaydedileceği klasör
UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# ═══ Gemini 2.5 Flash Free Tier Limitleri ═══
# RPM: 5, TPM: 250K, RPD: 20
DAILY_LIMIT_PER_USER = 20  # Günlük free tier limiti (RPD)
DAILY_LIMIT_TOTAL = 20
_daily_request_count: dict[str, int] = {}

# Dakikalık limit — Gemini 2.5 Flash Free Tier: 5 RPM, 250K TPM
_minute_requests: list[float] = []
RPM_LIMIT = 4  # 5 RPM limitinin 1 altı güvenlik payı

# ═══ Self-learning: önceki analizlerden öğrenme ═══
_analysis_history: list[dict] = []
MAX_HISTORY = 50

# Görsel max boyut (token tasarrufu)
IMAGE_MAX_DIMENSION = 1024  # px — büyük görselleri küçült


def _build_learning_context() -> str:
    """Önceki analizlerden öğrenilen bilgileri prompt'a ekler."""
    if not _analysis_history:
        return ""
    examples = _analysis_history[-10:]
    context = "\n\nÖnceki analizlerden öğrenilen referanslar:\n"
    for ex in examples:
        context += f"- {ex.get('item_name', '?')}: {ex.get('estimated_calories', '?')} kcal"
        if ex.get("caffeine_mg"):
            context += f", {ex['caffeine_mg']} mg kafein"
        context += "\n"
    context += "\nBenzer yiyecek/içecekler için daha tutarlı tahminler yap."
    return context


def _record_learning(analysis_result: dict):
    """Başarılı analiz sonucunu öğrenme geçmişine ekler."""
    if analysis_result.get("category") in ("food", "drink"):
        _analysis_history.append({
            "item_name": analysis_result.get("item_name"),
            "category": analysis_result.get("category"),
            "estimated_calories": analysis_result.get("estimated_calories"),
            "caffeine_mg": analysis_result.get("caffeine_mg"),
        })
        if len(_analysis_history) > MAX_HISTORY:
            _analysis_history.pop(0)


def _check_rpm():
    """Dakikalık istek limitini kontrol eder ve gerekirse bekler."""
    now = time.time()
    # Son 60 saniyedeki istekleri filtrele
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    if len(_minute_requests) >= RPM_LIMIT:
        # En eski isteğin 60 saniye dolmasını bekle
        wait = 60 - (now - _minute_requests[0]) + 1
        return max(wait, 1)
    return 0


def _check_rate_limit():
    """Günlük toplam istek limitini kontrol eder."""
    today = time.strftime("%Y-%m-%d")
    count = _daily_request_count.get(today, 0)
    if count >= DAILY_LIMIT_TOTAL:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Günlük AI analiz limiti doldu ({DAILY_LIMIT_TOTAL}/gün). Free tier sınırı. Yarın tekrar deneyin.",
        )
    for key in list(_daily_request_count.keys()):
        if key != today:
            del _daily_request_count[key]
    _daily_request_count[today] = count + 1


async def _check_user_daily_limit(db: AsyncSession, user_id: int):
    """Kullanıcı başına günlük istek limitini kontrol eder."""
    today = date.today()
    result = await db.execute(
        select(func.count(ImageAnalysis.id))
        .where(
            ImageAnalysis.user_id == user_id,
            func.date(ImageAnalysis.created_at) == today,
        )
    )
    count = result.scalar() or 0
    if count >= DAILY_LIMIT_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Günlük analiz limitiniz doldu ({DAILY_LIMIT_PER_USER}/gün).",
        )


def _resize_image(image_bytes: bytes, max_dim: int = IMAGE_MAX_DIMENSION) -> tuple[bytes, str]:
    """Görseli küçülterek token tüketimini azaltır. JPEG olarak döner."""
    img = Image.open(io.BytesIO(image_bytes))

    # EXIF rotation düzelt
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # RGBA → RGB
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Küçült
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue(), "image/jpeg"


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

    model = genai.GenerativeModel("gemini-2.5-flash")

    # Görseli oku ve küçült (token tasarrufu)
    raw_bytes = Path(file_path).read_bytes()
    image_data, mime_type = _resize_image(raw_bytes)

    logger.info(f"Görsel boyutu: {len(raw_bytes)} → {len(image_data)} bytes (küçültüldü)")

    learning_context = _build_learning_context()

    prompt = f"""Sen bir beslenme ve sağlık analiz uzmanısın. MindTrack sağlık günlüğü uygulaması için görselleri analiz ediyorsun.

Görevlerin:
- Yiyecek görselleri → yemek türü, tahmini kalori, besin değerleri
- İçecek görselleri → içecek türü, kalori, kafein miktarı (kahve, çay vb.)
- Diğer görseller → genel açıklama

Her analizde daha doğru tahminler yap.
{learning_context}

Yanıtın SADECE geçerli JSON olmalı:

{{
  "category": "food" veya "drink" veya "other",
  "item_name": "yiyecek veya içeceğin adı (Türkçe)",
  "estimated_calories": tahmini kalori (kcal, sayı),
  "caffeine_mg": kafein miktarı (mg, sadece içecekler için, yoksa null),
  "nutrients": {{
    "protein_g": tahmini protein (gram),
    "carb_g": tahmini karbonhidrat (gram),
    "fat_g": tahmini yağ (gram),
    "fiber_g": tahmini lif (gram)
  }},
  "description": "kısa Türkçe açıklama (1-2 cümle)",
  "health_notes": "sağlıkla ilgili kısa not veya öneri (Türkçe)"
}}

Yiyecek/içecek değilse category "other" yap, kalori/nutrient null olsun."""

    # RPM kontrolü — gerekirse bekle
    wait_seconds = _check_rpm()
    if wait_seconds > 0:
        logger.info(f"RPM limiti, {wait_seconds:.0f}s bekleniyor...")
        await asyncio.sleep(wait_seconds)

    # Retry: 3 deneme, rate limit'te bekle
    max_retries = 3
    for attempt in range(max_retries):
        try:
            _minute_requests.append(time.time())
            response = model.generate_content(
                [
                    {"mime_type": mime_type, "data": image_data},
                    prompt,
                ]
            )
            break
        except google_exceptions.ResourceExhausted:
            wait = 60 * (attempt + 1)  # 60s, 120s, 180s
            if attempt < max_retries - 1:
                logger.warning(f"Gemini rate limit (deneme {attempt+1}/{max_retries}), {wait}s bekleniyor...")
                await asyncio.sleep(wait)
            else:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API geçici olarak yoğun. Lütfen 2-3 dakika bekleyip tekrar deneyin.",
                )
        except google_exceptions.NotFound:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini modeli bulunamadı.",
            )
        except Exception as e:
            logger.error(f"Gemini API hatası: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI analiz hatası: {str(e)[:200]}",
            )

    # JSON parse
    text = response.text.strip()
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

    _record_learning(result)
    return result


async def create_image_analysis(
    db: AsyncSession,
    user_id: int,
    file: UploadFile,
    meal_type: str | None = None,
    health_data_id: int | None = None,
) -> ImageAnalysis:
    """Görseli yükler, Gemini ile analiz eder, sonucu veritabanına kaydeder."""
    await _check_user_daily_limit(db, user_id)
    _check_rate_limit()

    file_path = await save_upload_file(file, user_id)
    analysis_result = await analyze_image_with_gemini(file_path)

    category = analysis_result.get("category", "other")
    record = ImageAnalysis(
        user_id=user_id,
        file_path=file_path,
        category=category,
        meal_type=meal_type,
        health_data_id=health_data_id,
        analysis_result=analysis_result,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def create_bulk_image_analysis(
    db: AsyncSession,
    user_id: int,
    files: list[UploadFile],
    meal_type: str | None = None,
    health_data_id: int | None = None,
) -> list[ImageAnalysis]:
    """Birden fazla görseli toplu yükler ve sırayla Gemini ile analiz eder."""
    await _check_user_daily_limit(db, user_id)
    _check_rate_limit()

    # Günlük kalan hakkı kontrol et
    today = date.today()
    result = await db.execute(
        select(func.count(ImageAnalysis.id))
        .where(
            ImageAnalysis.user_id == user_id,
            func.date(ImageAnalysis.created_at) == today,
        )
    )
    current_count = result.scalar() or 0
    remaining = DAILY_LIMIT_PER_USER - current_count

    if len(files) > remaining:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Günlük {DAILY_LIMIT_PER_USER} analiz hakkınız var. Kalan: {remaining}, gönderilen: {len(files)}.",
        )

    # Önce tüm dosyaları kaydet
    file_paths: list[str] = []
    for file in files:
        path = await save_upload_file(file, user_id)
        file_paths.append(path)

    # Sırayla Gemini ile analiz et (RPM limitine uygun)
    records: list[ImageAnalysis] = []
    for file_path in file_paths:
        analysis_result = await analyze_image_with_gemini(file_path)

        category = analysis_result.get("category", "other")
        record = ImageAnalysis(
            user_id=user_id,
            file_path=file_path,
            category=category,
            meal_type=meal_type,
            health_data_id=health_data_id,
            analysis_result=analysis_result,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        records.append(record)

        # Global günlük sayacı artır
        today_str = time.strftime("%Y-%m-%d")
        _daily_request_count[today_str] = _daily_request_count.get(today_str, 0) + 1

    return records


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
    record = await get_image_analysis_by_id(db, user_id, analysis_id)
    file_path = Path(record.file_path)
    if file_path.exists():
        file_path.unlink()
    await db.delete(record)
    await db.commit()
