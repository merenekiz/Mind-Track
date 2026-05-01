import asyncio
import logging
import time

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

# Gemini embedding modeli (free tier: ~1500 RPM)
# gemini-embedding-001 doğal olarak 3072 boyutlu üretir; Matryoshka desteğiyle
# output_dimensionality=768 vererek pgvector tablosuyla (Vector(768)) uyumlu boyut alıyoruz.
EMBED_MODEL = "models/gemini-embedding-001"
EMBED_DIM = 768

_minute_requests: list[float] = []
RPM_LIMIT = 100


def _check_rpm() -> int:
    now = time.time()
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    if len(_minute_requests) >= RPM_LIMIT:
        wait = 60 - (now - _minute_requests[0]) + 1
        return max(int(wait), 1)
    return 0


async def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Tek bir metni 768 boyutlu embedding'e çevirir.

    task_type:
    - RETRIEVAL_DOCUMENT: DB'ye kaydedilecek dokümanlar için
    - RETRIEVAL_QUERY: arama sorgusu için
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API anahtarı yapılandırılmamış",
        )

    wait = _check_rpm()
    if wait > 0:
        await asyncio.sleep(wait)

    max_retries = 3
    for attempt in range(max_retries):
        try:
            _minute_requests.append(time.time())
            result = await asyncio.to_thread(
                genai.embed_content,
                model=EMBED_MODEL,
                content=text[:8000],
                task_type=task_type,
                output_dimensionality=EMBED_DIM,
            )
            embedding = result.get("embedding") if isinstance(result, dict) else result["embedding"]
            if not embedding or len(embedding) != EMBED_DIM:
                raise ValueError(f"Beklenmeyen embedding boyutu: {len(embedding) if embedding else 0}")
            return list(embedding)
        except google_exceptions.ResourceExhausted:
            if attempt < max_retries - 1:
                await asyncio.sleep(30 * (attempt + 1))
            else:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Embedding API kotası doldu, biraz sonra tekrar deneyin.",
                )
        except Exception as e:
            logger.error(f"Embedding hatası: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2)
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Embedding üretilemedi: {str(e)[:200]}",
                )

    raise HTTPException(status_code=500, detail="Embedding alınamadı")


async def embed_batch(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """Metin listesini sırayla embed eder (rate limit'e uyum için)."""
    out: list[list[float]] = []
    for t in texts:
        out.append(await embed_text(t, task_type=task_type))
    return out
