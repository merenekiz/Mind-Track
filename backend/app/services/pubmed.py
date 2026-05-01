import asyncio
import logging
import re
from datetime import date, datetime
from xml.etree import ElementTree as ET

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
PUBMED_TIMEOUT = 20.0


def _build_params(extra: dict) -> dict:
    """API key varsa parametrelere ekler (10 RPS), yoksa anahtarsız mod (3 RPS)."""
    params = {"tool": "MindTrack", "email": "noreply@mindtrack.app"}
    api_key = settings.PUBMED_API_KEY
    if api_key:
        params["api_key"] = api_key
    params.update(extra)
    return params


async def search_pubmed_ids(query: str, max_results: int = 5) -> list[str]:
    """
    PubMed'de arama yapar, ilgili makale ID'lerini döner.
    Türkçe sorgular için temel İngilizce çeviri haritası kullanılır.
    """
    en_query = _translate_query(query)

    params = _build_params({
        "db": "pubmed",
        "term": en_query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance",
    })

    async with httpx.AsyncClient(timeout=PUBMED_TIMEOUT) as client:
        try:
            r = await client.get(f"{PUBMED_BASE}/esearch.fcgi", params=params)
            r.raise_for_status()
            data = r.json()
            ids = data.get("esearchresult", {}).get("idlist", [])
            return ids
        except httpx.HTTPError as e:
            logger.error(f"PubMed esearch hatası: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"PubMed arama hatası: {str(e)[:200]}",
            )


async def fetch_pubmed_articles(pubmed_ids: list[str]) -> list[dict]:
    """
    PubMed ID listesi için makale detaylarını (title, abstract, authors, date) çeker.
    """
    if not pubmed_ids:
        return []

    params = _build_params({
        "db": "pubmed",
        "id": ",".join(pubmed_ids),
        "retmode": "xml",
    })

    async with httpx.AsyncClient(timeout=PUBMED_TIMEOUT) as client:
        try:
            r = await client.get(f"{PUBMED_BASE}/efetch.fcgi", params=params)
            r.raise_for_status()
            return _parse_pubmed_xml(r.text)
        except httpx.HTTPError as e:
            logger.error(f"PubMed efetch hatası: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"PubMed makale çekme hatası: {str(e)[:200]}",
            )


def _parse_pubmed_xml(xml_text: str) -> list[dict]:
    """PubMed efetch XML çıktısını yapılandırılmış listeye çevirir."""
    out: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        logger.error(f"PubMed XML parse hatası: {e}")
        return out

    for art in root.findall(".//PubmedArticle"):
        pmid_el = art.find(".//PMID")
        pmid = pmid_el.text if pmid_el is not None else None
        if not pmid:
            continue

        title_el = art.find(".//ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else ""

        abstract_parts = [
            "".join(t.itertext()).strip()
            for t in art.findall(".//Abstract/AbstractText")
        ]
        abstract = "\n\n".join(p for p in abstract_parts if p)

        authors = []
        for au in art.findall(".//Author"):
            last = au.findtext("LastName")
            first = au.findtext("ForeName")
            if last:
                authors.append(f"{first} {last}".strip() if first else last)
        authors_str = ", ".join(authors[:8])
        if len(authors) > 8:
            authors_str += " et al."

        pub_date = _extract_pub_date(art)

        out.append({
            "pubmed_id": pmid,
            "title": title,
            "abstract": abstract,
            "authors": authors_str,
            "published_date": pub_date,
        })

    return out


def _extract_pub_date(art) -> date | None:
    """ArticleDate veya PubDate elementinden tarih çıkarır."""
    for path in [".//ArticleDate", ".//PubDate"]:
        el = art.find(path)
        if el is None:
            continue
        year = el.findtext("Year")
        month = el.findtext("Month") or "1"
        day = el.findtext("Day") or "1"
        if not year:
            continue
        month_num = _month_to_num(month)
        try:
            return date(int(year), month_num, int(day))
        except (ValueError, TypeError):
            try:
                return date(int(year), 1, 1)
            except ValueError:
                return None
    return None


_MONTH_MAP = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}


def _month_to_num(m: str) -> int:
    if m.isdigit():
        return int(m)
    return _MONTH_MAP.get(m[:3], 1)


# Türkçe semptom → İngilizce arama terimi haritası (genişletilebilir)
_TR_EN: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\bbaş\s*ağrı\w*\b", re.I), "headache"),
    (re.compile(r"\bmigren\w*\b", re.I), "migraine"),
    (re.compile(r"\bbaş\s*dönmes\w*\b", re.I), "dizziness"),
    (re.compile(r"\bmide\s*bulant\w*\b", re.I), "nausea"),
    (re.compile(r"\bishal\b", re.I), "diarrhea"),
    (re.compile(r"\bkabızlık\b", re.I), "constipation"),
    (re.compile(r"\buyku\s*(bozukluğ\w*|sızlığ\w*)\b", re.I), "sleep disorder"),
    (re.compile(r"\buykusuzluk\b", re.I), "insomnia"),
    (re.compile(r"\bstres\b", re.I), "stress"),
    (re.compile(r"\banksiyete\b", re.I), "anxiety"),
    (re.compile(r"\bdepresyon\b", re.I), "depression"),
    (re.compile(r"\byorgunluk\b", re.I), "fatigue"),
    (re.compile(r"\bağrı\b", re.I), "pain"),
    (re.compile(r"\bateş\b", re.I), "fever"),
    (re.compile(r"\bnefes\s*darlığı\b", re.I), "dyspnea"),
    (re.compile(r"\bgöğüs\s*ağrı\w*\b", re.I), "chest pain"),
    (re.compile(r"\bkalp\s*çarpıntı\w*\b", re.I), "palpitations"),
    (re.compile(r"\bkafein\b", re.I), "caffeine"),
    (re.compile(r"\bkahve\b", re.I), "coffee"),
    (re.compile(r"\bbeslenme\b", re.I), "nutrition"),
    (re.compile(r"\bkalori\b", re.I), "calorie intake"),
]


def _translate_query(q: str) -> str:
    """Türkçe semptom anahtar kelimelerini İngilizce karşılıklarıyla genişletir."""
    out = q
    matches: list[str] = []
    for pat, en in _TR_EN:
        if pat.search(q):
            matches.append(en)
    if matches:
        # Orijinal Türkçe sorgu + İngilizce karşılıkları ile zengin sorgu
        return " OR ".join(matches) + " AND humans[Filter]"
    return q + " AND humans[Filter]"
