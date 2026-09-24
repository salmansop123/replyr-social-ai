"""Email/password auth (sign-up, sign-in, JWT)."""

import uuid

from fastapi.testclient import TestClient

from app.main import app


def test_sign_up_sign_in_and_org_me():
    client = TestClient(app)
    email = f"auth_test_{uuid.uuid4().hex[:10]}@example.com"
    password = "securepass123"

    sign_up = client.post(
        "/api/v1/auth/sign-up",
        json={"email": email, "password": password, "name": "Auth Tester", "business_name": "Auth Co"},
    )
    assert sign_up.status_code == 200
    body = sign_up.json()
    assert body.get("access_token")
    token = body["access_token"]

    org = client.get("/api/v1/org/me", headers={"Authorization": f"Bearer {token}"})
    assert org.status_code == 200
    assert org.json().get("name") == "Auth Co"

    sign_in = client.post("/api/v1/auth/sign-in", json={"email": email, "password": password})
    assert sign_in.status_code == 200
    assert sign_in.json().get("access_token")

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json().get("email") == email

    duplicate = client.post("/api/v1/auth/sign-up", json={"email": email, "password": password})
    assert duplicate.status_code == 409
