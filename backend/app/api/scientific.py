from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.scientific_document import ScientificDocument
from app.schemas.scientific import (
    IngestRequest,
    IngestResponse,
    SearchResultItem,
    ScientificDocumentOut,
)
from app.services.rag import ingest_for_query, retrieve_similar

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_articles(
    payload: IngestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    PubMed'den verilen sorguyla makale çeker, Gemini ile özetler,
    embedding üretir ve `scientific_documents` tablosuna kaydeder.
    Daha önce kaydedilmiş PMID'ler atlanır.
    """
    return await ingest_for_query(
        db,
        query=payload.query,
        max_results=payload.max_results,
        summarize=payload.summarize,
    )


@router.get("/search", response_model=list[SearchResultItem])
async def search_documents(
    q: str = Query(..., min_length=2, max_length=500),
    k: int = Query(5, ge=1, le=20),
    auto_ingest: bool = Query(True, description="Yetersiz sonuç varsa PubMed'den otomatik çek"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sorguya en yakın bilimsel dokümanları cosine similarity ile döner.
    Bu endpoint RAG retrieval bileşenidir; AI analiz pipeline'ında kullanılacaktır.
    """
    return await retrieve_similar(db, query=q, k=k, auto_ingest=auto_ingest)


@router.get("/", response_model=list[ScientificDocumentOut])
async def list_documents(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kayıtlı tüm bilimsel dokümanları (yeni → eski) listeler."""
    result = await db.execute(
        select(ScientificDocument)
        .order_by(desc(ScientificDocument.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())
