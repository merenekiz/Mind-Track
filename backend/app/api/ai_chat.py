"""
Hızlı AI sohbet endpoint'i — kullanıcı sohbet ekranında soru sorduğunda Gemini'ye
mevcut sağlık verisi özeti + soruyu gönderir, kısa Türkçe yanıt alır.

Bu endpoint AI Analiz Pipeline'ından farklıdır:
- AI Analiz: bütünsel + RAG + JSON yapı + DB kaydı (yavaş, raporsal)
- AI Chat: tek-tur yanıt, hızlı, kayıt yok (interaktif)
"""
import asyncio
import logging
import time
from datetime import date, timedelta

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.health_data import HealthData
from app.models.symptom import Symptom

logger = logging.getLogger(__name__)
router = APIRouter()

genai.configure(api_key=settings.GEMINI_API_KEY)

_minute_requests: list[float] = []
RPM_LIMIT = 4


def _check_rpm() -> int:
    now = time.time()
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    if len(_minute_requests) >= RPM_LIMIT:
        return max(int(60 - (now - _minute_requests[0]) + 1), 1)
    return 0


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kullanıcı mesajını Gemini'ye iletir, kişisel veri özeti ile zenginleştirir."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API yapılandırılmamış",
        )

    # Son 7 günün veri özeti
    today = date.today()
    week_ago = today - timedelta(days=7)

    health_q = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == current_user.id, HealthData.date >= week_ago)
        .order_by(desc(HealthData.date))
    )
    health_recs = list(health_q.scalars().all())

    symptom_q = await db.execute(
        select(Symptom)
        .where(Symptom.user_id == current_user.id, Symptom.date >= week_ago)
        .order_by(desc(Symptom.date))
        .limit(5)
    )
    symptom_recs = list(symptom_q.scalars().all())

    def avg(vals):
        clean = [v for v in vals if v is not None]
        return f"{sum(clean) / len(clean):.1f}" if clean else "—"

    summary_lines = [
        f"Son 7 gün ({len(health_recs)} kayıt):",
        f"- Ortalama uyku: {avg([h.sleep_hours for h in health_recs])} sa",
        f"- Ortalama stres: {avg([h.stress_level for h in health_recs])}/10",
        f"- Ortalama ağrı: {avg([h.pain_level for h in health_recs])}/10",
    ]
    if symptom_recs:
        summary_lines.append(f"- Son semptomlar: {', '.join(s.original_text[:50] for s in symptom_recs[:3])}")

    user_summary = "\n".join(summary_lines)

    prompt = f"""Sen MindTrack AI — kullanıcının sağlık günlüğünü analiz eden samimi, profesyonel bir asistansın.

KULLANICI VERİ ÖZETİ:
{user_summary}

KULLANICI SORUSU:
{payload.message}

KURALLAR:
- Kısa ve doğal cevap ver (2-4 cümle, gereksiz uzatma yok)
- Türkçe konuş, samimi ama profesyonel
- Kesin tıbbi teşhis koyma; bilimsel/öneri formatı kullan
- Kullanıcının verilerine atıfta bulun (varsa); veri yoksa "henüz verin yok" deyip soru sor
- Markdown veya başlık kullanma — düz akıcı metin
- Emoji çok az kullan (1-2 max, sadece uygun yerde)"""

    wait = _check_rpm()
    if wait > 0:
        await asyncio.sleep(wait)

    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        _minute_requests.append(time.time())
        response = await asyncio.to_thread(model.generate_content, prompt)
        return {"reply": response.text.strip()}
    except google_exceptions.ResourceExhausted:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Gemini API yoğun, biraz sonra tekrar deneyin.",
        )
    except Exception as e:
        logger.error(f"Chat hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI cevap üretemedi: {str(e)[:200]}",
        )
