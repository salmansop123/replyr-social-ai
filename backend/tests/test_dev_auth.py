"""Development auth bootstrap (Phase 1 local dev without Clerk)."""

from fastapi.testclient import TestClient

from app.main import app


def test_dev_bootstrap_and_org_me():
    client = TestClient(app)
    boot = client.post("/api/v1/auth/dev-bootstrap")
    assert boot.status_code == 200
    assert boot.json().get("ok") is True

    org = client.get("/api/v1/org/me", headers={"Authorization": "Bearer dev-local"})
    assert org.status_code == 200
    assert org.json().get("name")
