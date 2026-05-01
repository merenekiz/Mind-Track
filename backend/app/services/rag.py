import asyncio
import logging
from typing import Any

import google.generativeai as genai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.scientific_document import ScientificDocument
from app.services.pubmed import search_pubmed_ids, fetch_pubmed_articles
from app.services.embedding import embed_text

logger = logging.getLogger(__name__)


async def summarize_with_gemini(title: str, abstract: str) -> str:
    """Gemini ile makaleyi 2-3 cümle Türkçe özetler. Hata olursa abstract'ı kısaltıp döner."""
    if not abstract or len(abstract) < 50:
        return abstract or title

    if not settings.GEMINI_API_KEY:
        return abstract[:500]

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Aşağıdaki bilimsel makale özetini 2-3 cümle ile Türkçe olarak özetle.
Tıbbi bir teşhis koyma, sadece bulguları özetle.

Başlık: {title}

Özet:
{abstract[:3000]}

Türkçe özet (2-3 cümle):"""
        result = await asyncio.to_thread(model.generate_content, prompt)
        return result.text.strip()[:1000]
    except Exception as e:
        logger.warning(f"Özetleme atlandı, abstract kullanılıyor: {e}")
        return abstract[:500]


async def ingest_for_query(
    db: AsyncSession,
    query: str,
    max_results: int = 5,
    summarize: bool = True,
) -> dict:
    """
    Verilen sorgu için PubMed'den makale çeker, embed edip DB'ye kaydeder.
    Daha önce kaydedilmiş PMID'leri atlar.
    """
    pmids = await search_pubmed_ids(query, max_results=max_results)
    if not pmids:
        return {"query": query, "found": 0, "new": 0, "skipped": 0, "documents": []}

    # Var olanları çek (skip için)
    existing_q = await db.execute(
        select(ScientificDocument.pubmed_id).where(ScientificDocument.pubmed_id.in_(pmids))
    )
    existing_ids = {row[0] for row in existing_q.all()}
    new_pmids = [p for p in pmids if p not in existing_ids]

    if not new_pmids:
        return {
            "query": query,
            "found": len(pmids),
            "new": 0,
            "skipped": len(existing_ids),
            "documents": [],
        }

    articles = await fetch_pubmed_articles(new_pmids)
    saved: list[dict] = []

    for art in articles:
        try:
            content = art["abstract"] or art["title"]
            if not content:
                continue

            if summarize and art["abstract"]:
                summary = await summarize_with_gemini(art["title"], art["abstract"])
            else:
                summary = (art["abstract"] or art["title"])[:500]

            embed_input = f"{art['title']}\n\n{summary}"
            embedding = await embed_text(embed_input, task_type="RETRIEVAL_DOCUMENT")

            doc = ScientificDocument(
                pubmed_id=art["pubmed_id"],
                title=art["title"],
                abstract=summary,
                authors=art.get("authors"),
                published_date=art.get("published_date"),
                embedding=embedding,
            )
            db.add(doc)
            await db.commit()
            await db.refresh(doc)
            saved.append({
                "id": doc.id,
                "pubmed_id": doc.pubmed_id,
                "title": doc.title,
                "published_date": doc.published_date.isoformat() if doc.published_date else None,
            })
        except Exception as e:
            logger.error(f"Makale kaydedilemedi (PMID={art.get('pubmed_id')}): {e}")
            await db.rollback()

    return {
        "query": query,
        "found": len(pmids),
        "new": len(saved),
        "skipped": len(existing_ids),
        "documents": saved,
    }


async def retrieve_similar(
    db: AsyncSession,
    query: str,
    k: int = 5,
    auto_ingest: bool = True,
) -> list[dict]:
    """
    Sorguya en yakın bilimsel dokümanları cosine similarity ile getirir.
    Yeterli sonuç yoksa otomatik olarak PubMed'den ingest yapar.
    """
    query_embedding = await embed_text(query, task_type="RETRIEVAL_QUERY")

    # Cosine distance (pgvector <=> operatörü), düşük olan daha benzer
    stmt = (
        select(
            ScientificDocument,
            ScientificDocument.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .where(ScientificDocument.embedding.isnot(None))
        .order_by("distance")
        .limit(k)
    )
    result = await db.execute(stmt)
    rows = result.all()

    if len(rows) < k and auto_ingest:
        # Yetersiz sonuç → PubMed'den çek
        await ingest_for_query(db, query, max_results=k)
        result = await db.execute(stmt)
        rows = result.all()

    return [
        {
            "id": doc.id,
            "pubmed_id": doc.pubmed_id,
            "title": doc.title,
            "abstract": doc.abstract,
            "authors": doc.authors,
            "published_date": doc.published_date.isoformat() if doc.published_date else None,
            "similarity": round(1 - float(distance), 4),  # 1.0 = identik, 0 = alakasız
        }
        for doc, distance in rows
    ]
