"""Authentication smoke testleri."""
import httpx

API_URL = "http://localhost:8000"


def test_health_endpoint():
    r = httpx.get(f"{API_URL}/health", timeout=5)
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_register_login_flow(client, test_user):
    """test_user fixture başarılı kurulduysa register+login çalışıyor demektir."""
    assert test_user["token"]
    assert "@" in test_user["email"]


def test_login_wrong_password(client, test_user):
    r = client.post("/auth/login", json={
        "email": test_user["email"],
        "password": "WrongPassword!",
    })
    assert r.status_code == 401


def test_protected_endpoint_without_token(client):
    r = client.get("/health-data/")
    # 307 redirect → /health-data → /health-data/ veya direkt 401
    assert r.status_code in (307, 401, 403)
