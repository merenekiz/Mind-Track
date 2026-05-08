import asyncio
import json
import logging
import time
from datetime import date, timedelta
from typing import Any

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.ai_analysis_result import AIAnalysisResult
from app.models.health_data import HealthData
from app.models.symptom import Symptom
from app.models.image_analysis import ImageAnalysis
from app.services.rag import retrieve_similar

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

_minute_requests: list[float] = []
RPM_LIMIT = 4


def _check_rpm() -> int:
    now = time.time()
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    if len(_minute_requests) >= RPM_LIMIT:
        wait = 60 - (now - _minute_requests[0]) + 1
        return max(int(wait), 1)
    return 0


async def _collect_user_data(
    db: AsyncSession, user_id: int, target_date: date, days_back: int
) -> dict[str, Any]:
    """Kullanıcının son N gününe ait tüm verileri toplar."""
    start_date = target_date - timedelta(days=days_back - 1)

    health_q = await db.execute(
        select(HealthData)
        .where(
            HealthData.user_id == user_id,
            HealthData.date >= start_date,
            HealthData.date <= target_date,
        )
        .order_by(desc(HealthData.date))
    )
    health_records = list(health_q.scalars().all())

    symptom_q = await db.execute(
        select(Symptom)
        .where(
            Symptom.user_id == user_id,
            Symptom.date >= start_date,
            Symptom.date <= target_date,
        )
        .order_by(desc(Symptom.date))
    )
    symptom_records = list(symptom_q.scalars().all())

    image_q = await db.execute(
        select(ImageAnalysis)
        .where(ImageAnalysis.user_id == user_id)
        .order_by(desc(ImageAnalysis.created_at))
        .limit(10)
    )
    image_records = list(image_q.scalars().all())

    return {
        "period": {"start": start_date.isoformat(), "end": target_date.isoformat()},
        "health_data": [
            {
                "date": h.date.isoformat(),
                "pain_level": h.pain_level,
                "pain_type": h.pain_type,
                "sleep_hours": h.sleep_hours,
                "sleep_quality": h.sleep_quality,
                "stress_level": h.stress_level,
                "water_intake": h.water_intake,
                "activity_minutes": h.activity_minutes,
                "day_intensity": h.day_intensity,
                "mood": h.mood,
                "notes": h.notes,
            }
            for h in health_records
        ],
        "symptoms": [
            {
                "date": s.date.isoformat(),
                "original_text": s.original_text,
                "detected": s.detected_symptoms,
            }
            for s in symptom_records
        ],
        "nutrition_images": [
            {
                "date": img.created_at.date().isoformat(),
                "meal_type": getattr(img, "meal_type", None),
                "result": img.analysis_result,
            }
            for img in image_records
        ],
    }


def _extract_rag_query(data: dict) -> str | None:
    """Topladığımız verilerden RAG için en iyi sorguyu çıkarır."""
    parts: list[str] = []

    # En son semptomlardan
    for s in data.get("symptoms", [])[:3]:
        det = s.get("detected") or {}
        for sym in (det.get("symptoms") or [])[:3]:
            name = sym.get("name") if isinstance(sym, dict) else None
            if name:
                parts.append(name)

    # Sağlık verilerinden anlamlı sinyaller
    health = data.get("health_data", [])
    if health:
        avg_pain = [h["pain_level"] for h in health if h.get("pain_level") is not None]
        avg_sleep = [h["sleep_hours"] for h in health if h.get("sleep_hours") is not None]
        avg_stress = [h["stress_level"] for h in health if h.get("stress_level") is not None]
        if avg_pain and sum(avg_pain) / len(avg_pain) >= 5:
            parts.append("ağrı")
        if avg_sleep and sum(avg_sleep) / len(avg_sleep) < 6:
            parts.append("uykusuzluk")
        if avg_stress and sum(avg_stress) / len(avg_stress) >= 6:
            parts.append("stres")

    if not parts:
        return None
    # Tekrarları kaldır, sırayı koru
    seen = set()
    unique = [p for p in parts if not (p in seen or seen.add(p))]
    return " ".join(unique[:5])


async def _generate_with_gemini(
    user_data: dict, scientific_context: list[dict]
) -> dict[str, Any]:
    """Gemini ile sağlık yorumu üretir, JSON döner."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API anahtarı yapılandırılmamış",
        )

    sci_block = "\n\n".join(
        f"[{r['pubmed_id']}] {r['title']}\nÖzet: {r.get('abstract') or ''}"
        for r in scientific_context[:5]
    ) or "Bu analiz için ilgili bilimsel referans bulunamadı."

    prompt = f"""Sen bir sağlık veri analisti yapay zekasın. Aşağıdaki kullanıcının son günlerdeki verilerini ve ilgili bilimsel literatürü kullanarak Türkçe sağlık yorumu üret.

KULLANICI VERİLERİ (JSON):
{json.dumps(user_data, ensure_ascii=False, indent=2)[:6000]}

İLGİLİ BİLİMSEL LİTERATÜR:
{sci_block[:3000]}

KURALLAR:
- KESİN TIBBİ TEŞHİS KOYMA. Sadece veriler arasındaki ilişkileri ve genel önerileri sun.
- Bilimsel referanslara dayanan ifadelerde "araştırmalar gösteriyor ki" gibi kalıplar kullan.
- Gerekli görürsen "doktora danışmanız önerilir" notu ekle.
- Yanıtın YALNIZCA geçerli JSON olmalı, başka metin yok.

Aşağıdaki JSON şemasında yanıt ver:

{{
  "summary": "2-4 cümle Türkçe genel değerlendirme",
  "recommendations": [
    {{"title": "kısa başlık", "detail": "1-2 cümle açıklama", "priority": "düşük" | "orta" | "yüksek"}}
  ],
  "patterns": [
    "Veriler arası anlamlı örüntü/ilişki — 1 cümle"
  ],
  "should_consult_doctor": true | false,
  "consult_reason": "doktora danışma gerekçesi (eğer true ise) | null"
}}"""

    wait = _check_rpm()
    if wait > 0:
        await asyncio.sleep(wait)

    model = genai.GenerativeModel("gemini-2.5-flash")
    max_retries = 3
    response = None
    for attempt in range(max_retries):
        try:
            _minute_requests.append(time.time())
            response = await asyncio.to_thread(model.generate_content, prompt)
            break
        except google_exceptions.ResourceExhausted:
            if attempt < max_retries - 1:
                await asyncio.sleep(60 * (attempt + 1))
            else:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API yoğun, biraz sonra tekrar deneyin.",
                )
        except Exception as e:
            logger.error(f"Gemini analiz hatası: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI yorum üretilemedi: {str(e)[:200]}",
            )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "summary": "Yorum üretildi ancak yapısal olarak ayrıştırılamadı.",
            "recommendations": [],
            "patterns": [],
            "should_consult_doctor": False,
            "raw_response": raw[:500],
        }

    result.setdefault("summary", "")
    result.setdefault("recommendations", [])
    result.setdefault("patterns", [])
    result.setdefault("should_consult_doctor", False)
    return result


async def generate_analysis(
    db: AsyncSession,
    user_id: int,
    target_date: date,
    days_back: int = 7,
    include_rag: bool = True,
) -> AIAnalysisResult:
    """
    Tek prompt'ta birleştirilmiş veriyle Gemini üzerinden AI sağlık yorumu üretir
    ve `ai_analysis_results` tablosuna kaydeder.
    """
    user_data = await _collect_user_data(db, user_id, target_date, days_back)

    if not user_data["health_data"] and not user_data["symptoms"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu tarih aralığında analiz edilecek yeterli veri yok.",
        )

    scientific_context: list[dict] = []
    if include_rag:
        rag_query = _extract_rag_query(user_data)
        if rag_query:
            try:
                scientific_context = await retrieve_similar(
                    db, query=rag_query, k=5, auto_ingest=True
                )
            except Exception as e:
                logger.warning(f"RAG retrieve atlandı: {e}")
                scientific_context = []

    ai_result = await _generate_with_gemini(user_data, scientific_context)

    record = AIAnalysisResult(
        user_id=user_id,
        date=target_date,
        summary=ai_result.get("summary", ""),
        recommendations={
            "items": ai_result.get("recommendations", []),
            "patterns": ai_result.get("patterns", []),
            "should_consult_doctor": ai_result.get("should_consult_doctor", False),
            "consult_reason": ai_result.get("consult_reason"),
        },
        scientific_references={
            "items": [
                {
                    "pubmed_id": r["pubmed_id"],
                    "title": r["title"],
                    "similarity": r.get("similarity"),
                }
                for r in scientific_context
            ]
        } if scientific_context else None,
        data_used={
            "period": user_data["period"],
            "health_count": len(user_data["health_data"]),
            "symptom_count": len(user_data["symptoms"]),
            "nutrition_image_count": len(user_data["nutrition_images"]),
        },
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_analyses(
    db: AsyncSession, user_id: int, limit: int = 30
) -> list[AIAnalysisResult]:
    result = await db.execute(
        select(AIAnalysisResult)
        .where(AIAnalysisResult.user_id == user_id)
        .order_by(desc(AIAnalysisResult.date), desc(AIAnalysisResult.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_analysis(
    db: AsyncSession, user_id: int, analysis_id: int
) -> AIAnalysisResult:
    result = await db.execute(
        select(AIAnalysisResult).where(
            AIAnalysisResult.id == analysis_id,
            AIAnalysisResult.user_id == user_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI analiz kaydı bulunamadı",
        )
    return record


async def delete_analysis(
    db: AsyncSession, user_id: int, analysis_id: int
) -> None:
    record = await get_analysis(db, user_id, analysis_id)
    await db.delete(record)
    await db.commit()
