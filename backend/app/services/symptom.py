import asyncio
import json
import logging
import time
from datetime import date

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.symptom import Symptom

logger = logging.getLogger(__name__)

# Gemini yapılandırması
genai.configure(api_key=settings.GEMINI_API_KEY)

# ═══ Gemini 2.5 Flash Free Tier Limitleri ═══
# RPM: 5, TPM: 250K, RPD: 20 (image_analysis ile aynı kotayı paylaşır)
DAILY_LIMIT_PER_USER = 30  # Metin analizi daha hafif, biraz daha cömert
_minute_requests: list[float] = []
RPM_LIMIT = 4


def _check_rpm() -> int:
    """Dakikalık istek limitini kontrol eder ve gerekirse beklenecek saniyeyi döner."""
    now = time.time()
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    if len(_minute_requests) >= RPM_LIMIT:
        wait = 60 - (now - _minute_requests[0]) + 1
        return max(int(wait), 1)
    return 0


async def _check_user_daily_limit(db: AsyncSession, user_id: int):
    """Kullanıcı başına günlük semptom analizi limitini kontrol eder."""
    today = date.today()
    result = await db.execute(
        select(func.count(Symptom.id))
        .where(
            Symptom.user_id == user_id,
            func.date(Symptom.created_at) == today,
        )
    )
    count = result.scalar() or 0
    if count >= DAILY_LIMIT_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Günlük semptom analizi limitiniz doldu ({DAILY_LIMIT_PER_USER}/gün).",
        )


async def analyze_symptom_text(text: str) -> dict:
    """Gemini ile semptom metnini analiz eder, yapılandırılmış JSON döner."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API anahtarı yapılandırılmamış",
        )

    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""Sen bir tıbbi semptom analiz uzmanısın. Aşağıdaki Türkçe semptom metnini analiz et ve yapılandırılmış JSON olarak döndür.

Görevin:
- Metinde geçen tüm semptomları tespit et
- Her semptom için şiddet, vücut bölgesi ve süre bilgisini çıkar (varsa)
- Semptomları kategorize et (örn: nörolojik, gastrointestinal, kardiyovasküler, kas-iskelet, solunum, dermatolojik, psikolojik)
- Kısa Türkçe özet yaz

Metin: "{text}"

Yanıtın SADECE geçerli JSON olmalı (başka hiçbir metin yok):

{{
  "symptoms": [
    {{
      "name": "semptom adı (Türkçe)",
      "severity": "hafif" veya "orta" veya "şiddetli" veya null,
      "body_region": "vücut bölgesi (Türkçe)" veya null,
      "duration": "süre bilgisi (Türkçe)" veya null
    }}
  ],
  "summary": "1-2 cümle Türkçe özet",
  "suggested_categories": ["kategori1", "kategori2"]
}}

ÖNEMLİ:
- Tıbbi teşhis koyma, sadece semptomları tespit et
- Metin semptom içermiyorsa symptoms boş liste, summary'de açıkla
- JSON dışında HİÇBİR metin yazma, ```json bloğu kullanma"""

    # RPM kontrolü
    wait_seconds = _check_rpm()
    if wait_seconds > 0:
        logger.info(f"RPM limiti, {wait_seconds}s bekleniyor...")
        await asyncio.sleep(wait_seconds)

    # Retry: 3 deneme
    max_retries = 3
    response = None
    for attempt in range(max_retries):
        try:
            _minute_requests.append(time.time())
            response = model.generate_content(prompt)
            break
        except google_exceptions.ResourceExhausted:
            wait = 60 * (attempt + 1)
            if attempt < max_retries - 1:
                logger.warning(f"Gemini rate limit (deneme {attempt+1}/{max_retries}), {wait}s bekleniyor...")
                await asyncio.sleep(wait)
            else:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API geçici olarak yoğun. 2-3 dakika sonra tekrar deneyin.",
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
    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError:
        result = {
            "symptoms": [],
            "summary": "Metin analiz edilemedi.",
            "suggested_categories": [],
            "raw_response": raw_text[:500],
        }

    # Şema garantisi
    result.setdefault("symptoms", [])
    result.setdefault("summary", "")
    result.setdefault("suggested_categories", [])

    return result


async def create_symptom(
    db: AsyncSession, user_id: int, text: str, symptom_date: date | None = None
) -> Symptom:
    """Semptom metnini Gemini ile analiz eder ve veritabanına kaydeder."""
    await _check_user_daily_limit(db, user_id)

    analysis_result = await analyze_symptom_text(text)
    record = Symptom(
        user_id=user_id,
        original_text=text,
        detected_symptoms=analysis_result,
        date=symptom_date or date.today(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_symptoms(db: AsyncSession, user_id: int) -> list[Symptom]:
    """Kullanıcının tüm semptom analizlerini listeler."""
    result = await db.execute(
        select(Symptom)
        .where(Symptom.user_id == user_id)
        .order_by(desc(Symptom.created_at))
    )
    return list(result.scalars().all())


async def get_symptom_by_id(
    db: AsyncSession, user_id: int, symptom_id: int
) -> Symptom:
    result = await db.execute(
        select(Symptom)
        .where(Symptom.id == symptom_id, Symptom.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semptom kaydı bulunamadı",
        )
    return record


async def delete_symptom(
    db: AsyncSession, user_id: int, symptom_id: int
) -> None:
    record = await get_symptom_by_id(db, user_id, symptom_id)
    await db.delete(record)
    await db.commit()
