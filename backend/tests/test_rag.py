"""RAG (PubMed + pgvector + Gemini Embedding) smoke testleri."""
import pytest


@pytest.mark.slow
def test_search_returns_results(client, auth_headers):
    r = client.get(
        "/scientific/search",
        headers=auth_headers,
        params={"q": "headache", "k": 3, "auto_ingest": True},
        timeout=120,
    )
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # En az 1 sonuç dönmeli (auto_ingest açık)
    assert len(data) >= 1

    item = data[0]
    assert "pubmed_id" in item
    assert "title" in item
    assert "similarity" in item
    # Cosine similarity 0-1 aralığında olmalı
    assert 0 <= item["similarity"] <= 1


def test_list_documents(client, auth_headers):
    r = client.get("/scientific/?limit=20", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_search_validation(client, auth_headers):
    """Çok kısa sorgu 422 dönmeli."""
    r = client.get(
        "/scientific/search",
        headers=auth_headers,
        params={"q": "a"},
    )
    assert r.status_code == 422
