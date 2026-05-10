"""Sağlık verisi CRUD smoke testleri."""
from datetime import date


def test_create_health_data(client, auth_headers):
    payload = {
        "date": date.today().isoformat(),
        "pain_level": 4,
        "sleep_hours": 7.5,
        "sleep_quality": 4,
        "stress_level": 5,
        "water_intake": 2.0,
        "activity_minutes": 30,
        "day_intensity": 5,
        "mood": "neutral",
        "notes": "pytest sağlık verisi",
    }
    r = client.post("/health-data/", headers=auth_headers, json=payload)
    assert r.status_code in (200, 201), f"Create başarısız: {r.status_code} {r.text}"
    data = r.json()
    assert data["pain_level"] == 4
    assert data["sleep_hours"] == 7.5


def test_list_health_data(client, auth_headers):
    r = client.get("/health-data/", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # az önce oluşturduğumuz var


def test_required_fields_validation(client, auth_headers):
    """Tarih olmayan istek 422 dönmeli."""
    r = client.post("/health-data/", headers=auth_headers, json={"pain_level": 5})
    assert r.status_code == 422
