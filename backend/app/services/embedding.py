import asyncio
import logging
import time
from datetime import datetime, timezone

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

# ═══ Gemini Embedding 1 — Free Tier limitleri ═══
# Model: gemini-embedding-001
# RPM: 100 · TPM: 30,000 · RPD: 1,000
# 3072 boyutlu doğal çıktı; Matryoshka ile output_dimensionality=768 alıyoruz
# (pgvector tablosuyla uyum için).
EMBED_MODEL = "models/gemini-embedding-001"
EMBED_DIM = 768

# Limitlerin %90'ında çalış — burst toleransı için pay bırak
RPM_LIMIT = 90        # 100'ün altı
TPM_LIMIT = 27_000    # 30k'nın altı
RPD_LIMIT = 900       # 1000'in altı

_minute_requests: list[float] = []
_minute_tokens: list[tuple[float, int]] = []  # (timestamp, token_count)
_day_requests: list[float] = []


def _approx_tokens(text: str) -> int:
    """Kaba token tahmini: ~4 karakter = 1 token (Gemini için ortalama)."""
    return max(1, len(text) // 4)


def _check_limits(token_count: int) -> int:
    """Tüm limitleri kontrol eder; aşıldıysa bekleme süresi (s) döner."""
    now = time.time()

    # Eski kayıtları temizle
    _minute_requests[:] = [t for t in _minute_requests if now - t < 60]
    _minute_tokens[:] = [(t, n) for t, n in _minute_tokens if now - t < 60]
    _day_requests[:] = [t for t in _day_requests if now - t < 86400]

    # RPD (günlük) — bunu aştıysak uzun bekleme gerekir, hata
    if len(_day_requests) >= RPD_LIMIT:
        oldest = _day_requests[0]
        return max(int(86400 - (now - oldest) + 1), 60)

    # RPM
    if len(_minute_requests) >= RPM_LIMIT:
        return max(int(60 - (now - _minute_requests[0]) + 1), 1)

    # TPM — gelen request token miktarı eklenince aşılır mı?
    current_tpm = sum(n for _, n in _minute_tokens)
    if current_tpm + token_count > TPM_LIMIT:
        return max(int(60 - (now - _minute_tokens[0][0]) + 1), 1)

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

    truncated = text[:8000]
    tokens = _approx_tokens(truncated)

    wait = _check_limits(tokens)
    if wait > 0:
        if wait > 300:
            # Günlük kotaya yakın — hata fırlat, kullanıcı sonra denesin
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Günlük embedding kotasına yaklaşıldı ({len(_day_requests)}/{RPD_LIMIT}). Yarın tekrar deneyin.",
            )
        logger.info(f"Embedding rate limit, {wait}s bekleniyor...")
        await asyncio.sleep(wait)

    max_retries = 3
    for attempt in range(max_retries):
        try:
            now = time.time()
            _minute_requests.append(now)
            _minute_tokens.append((now, tokens))
            _day_requests.append(now)
            result = await asyncio.to_thread(
                genai.embed_content,
                model=EMBED_MODEL,
                content=truncated,
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
