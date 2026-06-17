"""Backend API tests for Patrika Director Office Visit app."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Try frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for ln in f:
                if ln.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = ln.split("=", 1)[1].strip().strip('"').rstrip("/")
                    break
    except Exception:
        pass

ADMIN_EMAIL = "admin@patrika.com"
ADMIN_PASSWORD = "admin123"

# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def user_credentials(admin_headers):
    """Create a regular test user."""
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@patrika.com"
    password = "userpass123"
    r = requests.post(f"{BASE_URL}/api/users", headers=admin_headers,
                      json={"email": email, "password": password,
                            "name": "TEST User", "role": "user"}, timeout=15)
    assert r.status_code == 200, f"create user failed: {r.status_code} {r.text}"
    return {"email": email, "password": password, "id": r.json()["id"]}


@pytest.fixture(scope="session")
def user_headers(user_credentials):
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": user_credentials["email"],
                            "password": user_credentials["password"]}, timeout=15)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}",
            "Content-Type": "application/json"}


# ---------- Auth ----------

def test_login_success():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "access_token" in d and isinstance(d["access_token"], str)
    assert d["user"]["email"] == ADMIN_EMAIL
    assert d["user"]["role"] == "admin"


def test_login_invalid():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_me_endpoint(admin_headers):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_me_no_token():
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
    assert r.status_code == 401


# ---------- Users ----------

def test_list_users_admin(admin_headers):
    r = requests.get(f"{BASE_URL}/api/users", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    users = r.json()
    assert any(u["email"] == ADMIN_EMAIL for u in users)


def test_list_users_forbidden_for_user(user_headers):
    r = requests.get(f"{BASE_URL}/api/users", headers=user_headers, timeout=15)
    assert r.status_code == 403


def test_create_and_delete_user(admin_headers):
    email = f"TEST_crud_{uuid.uuid4().hex[:8]}@patrika.com"
    r = requests.post(f"{BASE_URL}/api/users", headers=admin_headers,
                      json={"email": email, "password": "p123",
                            "name": "TEST CRUD", "role": "user"}, timeout=15)
    assert r.status_code == 200
    uid = r.json()["id"]
    # duplicate email rejected
    r2 = requests.post(f"{BASE_URL}/api/users", headers=admin_headers,
                       json={"email": email, "password": "p123",
                             "name": "TEST CRUD", "role": "user"}, timeout=15)
    assert r2.status_code == 400
    # patch
    r3 = requests.patch(f"{BASE_URL}/api/users/{uid}", headers=admin_headers,
                        json={"name": "TEST RENAMED"}, timeout=15)
    assert r3.status_code == 200
    assert r3.json()["name"] == "TEST RENAMED"
    # delete
    r4 = requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=15)
    assert r4.status_code == 200


# ---------- Visits ----------

@pytest.fixture(scope="session")
def admin_visit_id(admin_headers):
    r = requests.post(f"{BASE_URL}/api/visits", headers=admin_headers,
                      json={"branch_name": "TEST_Jaipur",
                            "visit_date": "2026-01-10",
                            "visiting_team": "TEST Team"}, timeout=15)
    assert r.status_code == 200
    return r.json()["id"]


def test_create_visit(admin_visit_id):
    assert admin_visit_id


def test_get_visit(admin_headers, admin_visit_id):
    r = requests.get(f"{BASE_URL}/api/visits/{admin_visit_id}",
                     headers=admin_headers, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["branch_name"] == "TEST_Jaipur"
    # 9 segment keys initialised
    expected = {"branch_head", "circulation", "agent", "hawker", "correspondent",
                "advertisement", "ad_agency", "recovery", "summary"}
    assert expected.issubset(set(d["segments"].keys()))


def test_list_visits_admin_sees_all(admin_headers, admin_visit_id):
    r = requests.get(f"{BASE_URL}/api/visits", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    ids = [v["id"] for v in r.json()]
    assert admin_visit_id in ids


def test_user_cannot_access_admins_visit(user_headers, admin_visit_id):
    r = requests.get(f"{BASE_URL}/api/visits/{admin_visit_id}",
                     headers=user_headers, timeout=15)
    assert r.status_code == 403


def test_segment_update_and_persistence(admin_headers, admin_visit_id):
    payload = {
        "data": {"daily_copies": 5000, "last_year_copies": 4500,
                 "monthly_revenue": 1200000, "outstanding": 350000,
                 "q1_problems": "Distribution gaps"},
        "positives": "Team motivated",
        "negatives": "Outstanding high",
        "note": "Need follow-up next month"
    }
    r = requests.put(
        f"{BASE_URL}/api/visits/{admin_visit_id}/segment/branch_head",
        headers=admin_headers, json=payload, timeout=20)
    assert r.status_code == 200, r.text
    # GET to verify persistence
    r2 = requests.get(f"{BASE_URL}/api/visits/{admin_visit_id}",
                      headers=admin_headers, timeout=15)
    seg = r2.json()["segments"]["branch_head"]
    assert seg["daily_copies"] == 5000
    assert seg["q1_problems"] == "Distribution gaps"


def test_invalid_segment_key(admin_headers, admin_visit_id):
    r = requests.put(
        f"{BASE_URL}/api/visits/{admin_visit_id}/segment/invalid_key",
        headers=admin_headers, json={"data": {}}, timeout=15)
    assert r.status_code == 400


# ---------- Schemas ----------

def test_schema_get_default(admin_headers):
    r = requests.get(f"{BASE_URL}/api/schemas/branch_head",
                     headers=admin_headers, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["segment_key"] == "branch_head"


def test_schema_put_admin_only(user_headers):
    r = requests.put(f"{BASE_URL}/api/schemas/branch_head",
                     headers=user_headers,
                     json={"segment_key": "branch_head",
                           "label_overrides": {}, "disabled_fields": [],
                           "extra_questions": []}, timeout=15)
    assert r.status_code == 403


def test_schema_put_update(admin_headers):
    payload = {
        "segment_key": "branch_head",
        "label_overrides": {"q1_problems": "TEST Renamed Problems"},
        "disabled_fields": ["last_year_copies"],
        "extra_questions": [{
            "id": str(uuid.uuid4()),
            "key": "test_custom_q",
            "label": "TEST Custom Question",
            "hindi": "", "kind": "textarea", "span": 2, "order": 0
        }]
    }
    r = requests.put(f"{BASE_URL}/api/schemas/branch_head",
                     headers=admin_headers, json=payload, timeout=15)
    assert r.status_code == 200
    # GET back
    r2 = requests.get(f"{BASE_URL}/api/schemas/branch_head",
                      headers=admin_headers, timeout=15)
    d = r2.json()
    assert d["label_overrides"]["q1_problems"] == "TEST Renamed Problems"
    assert "last_year_copies" in d["disabled_fields"]
    # cleanup overrides
    requests.put(f"{BASE_URL}/api/schemas/branch_head", headers=admin_headers,
                 json={"segment_key": "branch_head", "label_overrides": {},
                       "disabled_fields": [], "extra_questions": []}, timeout=15)


# ---------- Audit logs ----------

def test_audit_logs_visible(admin_headers, admin_visit_id):
    r = requests.get(f"{BASE_URL}/api/audit-logs?visit_id={admin_visit_id}",
                     headers=admin_headers, timeout=15)
    assert r.status_code == 200
    logs = r.json()
    actions = {x["action"] for x in logs}
    assert "visit_created" in actions
    assert "segment_updated" in actions


def test_audit_logs_user_restricted(user_headers, admin_visit_id):
    r = requests.get(f"{BASE_URL}/api/audit-logs?visit_id={admin_visit_id}",
                     headers=user_headers, timeout=15)
    # User cannot view admin's visit logs
    assert r.status_code == 403


# ---------- AI Analysis (slow) ----------

def test_ai_analyze_segment(admin_headers, admin_visit_id):
    r = requests.post(
        f"{BASE_URL}/api/visits/{admin_visit_id}/analyze/branch_head",
        headers=admin_headers, timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["segment"] == "branch_head"
    assert isinstance(d["insight"], str) and len(d["insight"]) > 50


def test_ai_executive_summary(admin_headers, admin_visit_id):
    r = requests.post(
        f"{BASE_URL}/api/visits/{admin_visit_id}/executive-summary",
        headers=admin_headers, timeout=180)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "summary" in d and len(d["summary"]) > 50


# ---------- Cleanup ----------

def test_zz_cleanup_visit(admin_headers, admin_visit_id):
    r = requests.delete(f"{BASE_URL}/api/visits/{admin_visit_id}",
                        headers=admin_headers, timeout=15)
    assert r.status_code == 200


def test_zz_cleanup_user(admin_headers, user_credentials):
    r = requests.delete(f"{BASE_URL}/api/users/{user_credentials['id']}",
                        headers=admin_headers, timeout=15)
    assert r.status_code == 200
