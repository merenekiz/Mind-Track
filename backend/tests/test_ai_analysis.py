"""AI Analiz Pipeline (RAG + Gemini) smoke testleri."""
from datetime import date

import pytest


@pytest.mark.slow
def test_generate_ai_analysis_full_pipeline(client, auth_headers):
    """
    Tam pipeline testi:
    - Veri agregasyonu
    - RAG retrieval (pgvector)
    - Gemini ile yorum üretimi
    - DB kaydı
    """
    # Önce minimum veri seed et (health + symptom)
    client.post(
        "/health-data/",
        headers=auth_headers,
        json={
            "date": date.today().isoformat(),
            "pain_level": 7,
            "sleep_hours": 4.5,
            "stress_level": 8,
            "mood": "yorgun",
        },
    )
    client.post(
        "/symptoms/",
        headers=auth_headers,
        json={"text": "Baş ağrısı ve uykusuzluk yaşıyorum, çok stresliyim."},
    )

    r = client.post(
        "/ai-analysis/generate",
        headers=auth_headers,
        json={"days_back": 7, "include_rag": True},
        timeout=180,
    )
    assert r.status_code == 200, f"AI analiz başarısız: {r.text}"
    data = r.json()

    # Şema kontrolü
    assert "summary" in data and len(data["summary"]) > 0
    assert "recommendations" in data
    assert "items" in data["recommendations"]
    assert "data_used" in data

    # En az bir öneri üretilmiş olmalı
    assert isinstance(data["recommendations"]["items"], list)
    assert len(data["recommendations"]["items"]) >= 1

    # Bilimsel referanslar (RAG çalışıyorsa)
    if data.get("scientific_references"):
        refs = data["scientific_references"]["items"]
        assert isinstance(refs, list)
        for ref in refs:
            assert "pubmed_id" in ref
            assert "title" in ref


def test_list_ai_analyses(client, auth_headers):
    r = client.get("/ai-analysis/?limit=10", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
