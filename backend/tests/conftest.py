"""
Smoke test fixtures.

Bu testler ÇALIŞAN backend'e karşı koşar (http://localhost:8000).
Backend'i ayrı terminal'de başlat: `uvicorn app.main:app --reload`
"""
import os
import secrets
import time

import httpx
import pytest

API_URL = os.getenv("MINDTRACK_API_URL", "http://localhost:8000")
API_V1 = f"{API_URL}/api/v1"


def pytest_collection_modifyitems(config, items):
    """Backend ulaşılamazsa tüm testleri skip et."""
    try:
        r = httpx.get(f"{API_URL}/health", timeout=2)
        if r.status_code == 200:
            return
    except httpx.HTTPError:
        pass
    skip = pytest.mark.skip(reason=f"Backend {API_URL} ulaşılamıyor — uvicorn'u başlat")
    for item in items:
        item.add_marker(skip)


@pytest.fixture(scope="session")
def client():
    return httpx.Client(base_url=API_V1, timeout=120, follow_redirects=True)


@pytest.fixture(scope="session")
def test_user(client):
    """Tek seferlik benzersiz test hesabı oluşturur ve token döner."""
    suffix = secrets.token_hex(4)
    email = f"pytest_{suffix}@example.com"
    password = "Pytest1234!"

    r = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Pytest User",
    })
    assert r.status_code in (200, 201), f"Register başarısız: {r.status_code} {r.text}"

    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login başarısız: {r.text}"
    token = r.json()["access_token"]
    return {"email": email, "password": password, "token": token, "id": r.json().get("user", {}).get("id")}


@pytest.fixture(scope="session")
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}"}
