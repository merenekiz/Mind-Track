"""Semptom metin analizi smoke testleri."""


def test_create_symptom_with_gemini(client, auth_headers):
    """Gemini ile gerçek semptom analizi — yapılandırılmış JSON dönmeli."""
    r = client.post(
        "/symptoms/",
        headers=auth_headers,
        json={"text": "Bugün başım çok ağrıyor ve midem bulanıyor."},
    )
    assert r.status_code == 200, f"Symptom create başarısız: {r.text}"
    data = r.json()

    assert "detected_symptoms" in data
    assert "symptoms" in data["detected_symptoms"]
    assert isinstance(data["detected_symptoms"]["symptoms"], list)
    # Genel olarak en az 1 semptom tespit edilmiş olmalı
    assert len(data["detected_symptoms"]["symptoms"]) >= 1


def test_symptom_text_too_short(client, auth_headers):
    """Çok kısa metin 422 dönmeli (min_length=3)."""
    r = client.post("/symptoms/", headers=auth_headers, json={"text": "a"})
    assert r.status_code == 422


def test_list_symptoms(client, auth_headers):
    r = client.get("/symptoms/", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
