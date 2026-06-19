from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

from google import genai
from google.genai import types as genai_types

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Utils ----------

SEGMENT_KEYS = ["branch_head", "circulation", "agent", "hawker",
                "correspondent", "advertisement", "ad_agency", "recovery", "summary"]

SEGMENT_TITLES = {
    "branch_head": "Branch Head Interaction",
    "circulation": "Circulation Incharge Review",
    "agent": "Agent Feedback",
    "hawker": "Hawker Feedback",
    "correspondent": "Correspondent Feedback",
    "advertisement": "Advertisement Team Review",
    "ad_agency": "Advertising Agency Feedback",
    "recovery": "Recovery Review",
    "summary": "Daily Visit Summary",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ---------- Models ----------

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    last_login: Optional[str] = None
    is_active: bool = True


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"  # admin can override


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VisitCreate(BaseModel):
    branch_name: str
    visit_date: str
    visiting_team: Optional[str] = ""
    notes: Optional[str] = ""


class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_name: str
    visit_date: str
    visiting_team: str = ""
    notes: str = ""
    segments: Dict[str, Any] = Field(default_factory=dict)
    ai_insights: Dict[str, str] = Field(default_factory=dict)
    executive_summary: str = ""
    created_by: str = ""
    created_by_name: str = ""
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)
    last_edited_by_name: str = ""


class SegmentUpdate(BaseModel):
    data: Dict[str, Any]
    note: Optional[str] = ""
    positives: Optional[str] = ""
    negatives: Optional[str] = ""


class CustomQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str                      # unique field key
    label: str
    hindi: Optional[str] = ""
    kind: str = "textarea"        # text | textarea | number
    span: int = 2
    order: int = 0


class SegmentOverride(BaseModel):
    """Admin override for a segment's default schema."""
    model_config = ConfigDict(extra="ignore")
    segment_key: str
    label_overrides: Dict[str, str] = Field(default_factory=dict)
    disabled_fields: List[str] = Field(default_factory=list)
    extra_questions: List[CustomQuestion] = Field(default_factory=list)


# ---------- Auth dependency ----------

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------- Audit ----------

async def add_audit(visit_id: str, branch_name: str, user: dict, action: str,
                    segment_key: str = "", note: str = "", positives: str = "",
                    negatives: str = ""):
    entry = {
        "id": str(uuid.uuid4()),
        "visit_id": visit_id,
        "branch_name": branch_name,
        "user_id": user.get("id", ""),
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "action": action,
        "segment_key": segment_key,
        "note": note or "",
        "positives": positives or "",
        "negatives": negatives or "",
        "timestamp": _now_iso(),
    }
    await db.audit_logs.insert_one(entry)


# ---------- Startup: seed admin ----------

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.audit_logs.create_index("visit_id")
    await db.audit_logs.create_index("timestamp")
    await db.visits.create_index("id", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@patrika.com").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "is_active": True,
            "created_at": _now_iso(),
            "last_login": None,
        }
        await db.users.insert_one(doc)
        logger.info(f"Admin user seeded: {admin_email}")
    else:
        # Keep admin password in sync with env
        if not verify_password(admin_password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )
            logger.info("Admin password updated from env")


# ---------- Auth routes ----------

@api_router.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": _now_iso()}})
    token = create_token(user["id"], user["email"], user["role"])
    return {
        "access_token": token,
        "user": {
            "id": user["id"], "email": user["email"], "name": user["name"],
            "role": user["role"], "created_at": user["created_at"],
        }
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"ok": True}


# ---------- Users (admin) ----------

@api_router.get("/users", response_model=List[UserOut])
async def list_users(admin: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return [UserOut(**d) for d in docs]


@api_router.post("/users", response_model=UserOut)
async def create_user(payload: RegisterIn, admin: dict = Depends(require_admin)):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    if payload.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Invalid role")
    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": payload.role,
        "is_active": True,
        "created_at": _now_iso(),
        "last_login": None,
    }
    await db.users.insert_one(doc)
    return UserOut(**{k: v for k, v in doc.items() if k != "password_hash"})


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    res = await db.users.delete_one({"id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


class UserPatch(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


@api_router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserPatch, admin: dict = Depends(require_admin)):
    update = {}
    if payload.name is not None:
        update["name"] = payload.name.strip()
    if payload.role is not None:
        if payload.role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Invalid role")
        update["role"] = payload.role
    if payload.is_active is not None:
        update["is_active"] = payload.is_active
    if payload.password:
        update["password_hash"] = hash_password(payload.password)
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.users.update_one({"id": user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserOut(**doc)


# ---------- Visits ----------

@api_router.get("/")
async def root():
    return {"message": "Patrika Director Office Visit API", "version": "2.0"}


@api_router.post("/visits", response_model=Visit)
async def create_visit(payload: VisitCreate, user: dict = Depends(get_current_user)):
    visit = Visit(
        branch_name=payload.branch_name.strip(),
        visit_date=payload.visit_date,
        visiting_team=(payload.visiting_team or "").strip(),
        notes=(payload.notes or "").strip(),
        segments={k: {} for k in SEGMENT_KEYS},
        created_by=user["id"],
        created_by_name=user["name"],
        last_edited_by_name=user["name"],
    )
    doc = visit.model_dump()
    await db.visits.insert_one(doc)
    await add_audit(visit.id, visit.branch_name, user, "visit_created",
                    note=f"Visit created for {visit.branch_name}")
    return visit


@api_router.get("/visits", response_model=List[Visit])
async def list_visits(user: dict = Depends(get_current_user)):
    query = {} if user["role"] == "admin" else {"created_by": user["id"]}
    docs = await db.visits.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Visit(**d) for d in docs]


@api_router.get("/visits/{visit_id}", response_model=Visit)
async def get_visit(visit_id: str, user: dict = Depends(get_current_user)):
    doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    if user["role"] != "admin" and doc.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return Visit(**doc)


@api_router.put("/visits/{visit_id}/segment/{segment_key}", response_model=Visit)
async def update_segment(visit_id: str, segment_key: str, payload: SegmentUpdate,
                         user: dict = Depends(get_current_user)):
    if segment_key not in SEGMENT_KEYS:
        raise HTTPException(status_code=400, detail="Invalid segment key")
    doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    if user["role"] != "admin" and doc.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    segments = doc.get("segments", {}) or {}
    segments[segment_key] = payload.data
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {"segments": segments, "updated_at": _now_iso(),
                  "last_edited_by_name": user["name"]}}
    )
    await add_audit(visit_id, doc.get("branch_name", ""), user, "segment_updated",
                    segment_key=segment_key, note=payload.note or "",
                    positives=payload.positives or "", negatives=payload.negatives or "")
    doc["segments"] = segments
    doc["updated_at"] = _now_iso()
    doc["last_edited_by_name"] = user["name"]
    return Visit(**doc)


@api_router.delete("/visits/{visit_id}")
async def delete_visit(visit_id: str, user: dict = Depends(get_current_user)):
    doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    if user["role"] != "admin" and doc.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.visits.delete_one({"id": visit_id})
    await add_audit(visit_id, doc.get("branch_name", ""), user, "visit_deleted",
                    note=f"Visit deleted for {doc.get('branch_name', '')}")
    return {"ok": True}


# ---------- Custom Segment Schema Overrides ----------

@api_router.get("/schemas/{segment_key}")
async def get_schema_override(segment_key: str, user: dict = Depends(get_current_user)):
    if segment_key not in SEGMENT_KEYS:
        raise HTTPException(status_code=400, detail="Invalid segment key")
    doc = await db.segment_overrides.find_one({"segment_key": segment_key}, {"_id": 0})
    if not doc:
        return SegmentOverride(segment_key=segment_key).model_dump()
    return doc


@api_router.put("/schemas/{segment_key}")
async def put_schema_override(segment_key: str, payload: SegmentOverride,
                              admin: dict = Depends(require_admin)):
    if segment_key not in SEGMENT_KEYS:
        raise HTTPException(status_code=400, detail="Invalid segment key")
    data = payload.model_dump()
    data["segment_key"] = segment_key
    await db.segment_overrides.update_one(
        {"segment_key": segment_key}, {"$set": data}, upsert=True
    )
    return data


@api_router.get("/schemas")
async def list_schemas(user: dict = Depends(get_current_user)):
    docs = await db.segment_overrides.find({}, {"_id": 0}).to_list(50)
    return {d["segment_key"]: d for d in docs}


# ---------- Audit Logs (History) ----------

@api_router.get("/audit-logs")
async def list_audit_logs(visit_id: Optional[str] = None,
                          user: dict = Depends(get_current_user)):
    query: Dict[str, Any] = {}
    if visit_id:
        query["visit_id"] = visit_id
    if user["role"] != "admin":
        # restrict to the user's own visits
        own_ids = [v["id"] async for v in db.visits.find({"created_by": user["id"]}, {"id": 1})]
        if visit_id and visit_id not in own_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        if not visit_id:
            query["visit_id"] = {"$in": own_ids}
    docs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(2000)
    return docs


# ---------- AI ----------

SYSTEM_PROMPT_SEGMENT = (
    "You are a senior business analyst at Rajasthan Patrika's Director Office. "
    "Your job is to analyse branch visit data and produce crisp, actionable insights. "
    "Always reply in clear English (the voice senior management uses). "
    "Output STRICTLY in this structure:\n\n"
    "### Key Findings\n- 3-5 bullet points (data-grounded)\n\n"
    "### Root Causes\n- 2-3 bullet points\n\n"
    "### Suggestions & Ideas\n- 4-6 concrete, actionable suggestions\n\n"
    "### 30/60/90 Day Action Plan\n- 30 days: ...\n- 60 days: ...\n- 90 days: ...\n\n"
    "Be concise. Avoid generic statements. Use only the data provided."
)

SYSTEM_PROMPT_EXEC = (
    "You are writing the Executive Summary for Rajasthan Patrika's Director. "
    "Produce a consolidated, board-room-ready summary of the entire visit. Reply in clear English. "
    "Structure:\n\n"
    "### Executive Snapshot\n2-3 line overview.\n\n"
    "### Top 5 Critical Issues\n1-5 numbered\n\n"
    "### Worst 5 Performers / Weak Areas\n1-5 numbered\n\n"
    "### Top 5 Growth Opportunities\n1-5 numbered\n\n"
    "### Recommended Director Actions\n3-5 specific decisions/orders the Director can issue.\n\n"
    "### 90-Day Turnaround Plan\nShort paragraph.\n\n"
    "Tone: Authoritative, data-driven, McKinsey-style. No fluff."
)


async def _run_llm(system_msg: str, user_text: str) -> str:
    if not gemini_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        resp = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_text,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_msg,
                max_output_tokens=1500,
            ),
        )
        return resp.text or ""
    except Exception as e:
        logger.exception("LLM error")
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")


def _segment_to_text(segment_key: str, data: Dict[str, Any]) -> str:
    title = SEGMENT_TITLES.get(segment_key, segment_key)
    lines = [f"Segment: {title}", ""]
    if not data:
        lines.append("(No data provided)")
        return "\n".join(lines)
    for k, v in data.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for i, row in enumerate(v, 1):
                if isinstance(row, dict):
                    parts = ", ".join(f"{rk}={rv}" for rk, rv in row.items() if rv not in (None, ""))
                    if parts:
                        lines.append(f"  {i}. {parts}")
                else:
                    if row:
                        lines.append(f"  {i}. {row}")
        elif isinstance(v, dict):
            lines.append(f"{k}:")
            for rk, rv in v.items():
                lines.append(f"  - {rk}: {rv}")
        else:
            if v not in (None, ""):
                lines.append(f"{k}: {v}")
    return "\n".join(lines)


@api_router.post("/visits/{visit_id}/analyze/{segment_key}")
async def analyze_segment(visit_id: str, segment_key: str,
                          user: dict = Depends(get_current_user)):
    if segment_key not in SEGMENT_KEYS:
        raise HTTPException(status_code=400, detail="Invalid segment key")
    doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    if user["role"] != "admin" and doc.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    segment_data = (doc.get("segments") or {}).get(segment_key, {})
    context = (
        f"Branch: {doc.get('branch_name')}\n"
        f"Visit Date: {doc.get('visit_date')}\n"
        f"Visiting Team: {doc.get('visiting_team', '')}\n\n"
        + _segment_to_text(segment_key, segment_data)
    )

    insight = await _run_llm(SYSTEM_PROMPT_SEGMENT, context)
    ai_insights = doc.get("ai_insights") or {}
    ai_insights[segment_key] = insight
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {"ai_insights": ai_insights, "updated_at": _now_iso()}}
    )
    await add_audit(visit_id, doc.get("branch_name", ""), user, "ai_analysis",
                    segment_key=segment_key, note="AI insight generated")
    return {"segment": segment_key, "insight": insight}


@api_router.post("/visits/{visit_id}/executive-summary")
async def executive_summary(visit_id: str, user: dict = Depends(get_current_user)):
    doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    if user["role"] != "admin" and doc.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    parts = [
        f"Branch: {doc.get('branch_name')}",
        f"Visit Date: {doc.get('visit_date')}",
        f"Visiting Team: {doc.get('visiting_team', '')}",
        "",
        "=== ALL SEGMENTS DATA ===",
        "",
    ]
    for key in SEGMENT_KEYS:
        parts.append("---")
        parts.append(_segment_to_text(key, (doc.get("segments") or {}).get(key, {})))
        parts.append("")

    summary = await _run_llm(SYSTEM_PROMPT_EXEC, "\n".join(parts))
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {"executive_summary": summary, "updated_at": _now_iso()}}
    )
    await add_audit(visit_id, doc.get("branch_name", ""), user, "executive_summary",
                    note="Executive summary generated")
    return {"summary": summary}


# ---------- Aggregate Dashboard ----------

@api_router.get("/dashboard/aggregate")
async def aggregate_dashboard(user_id: Optional[str] = None,
                              user: dict = Depends(get_current_user)):
    """Aggregated KPIs across visits. Admin sees all; user sees own.
    Optional ?user_id filter — admin-only."""
    query: Dict[str, Any] = {}
    if user["role"] != "admin":
        query["created_by"] = user["id"]
    elif user_id:
        query["created_by"] = user_id

    visits = await db.visits.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)

    total_daily = total_last_year = total_revenue = total_outstanding = 0
    total_ad_target = total_ad_achievement = 0
    weak_agents_count = lost_clients_count = 0
    parties_total_outstanding = 0
    ageing_buckets = {"0-30": 0, "31-60": 0, "61-90": 0, "90+": 0}
    by_branch: List[Dict[str, Any]] = []

    for v in visits:
        seg = v.get("segments", {}) or {}
        bh = seg.get("branch_head", {}) or {}
        adv = seg.get("advertisement", {}) or {}
        circ = seg.get("circulation", {}) or {}
        rec = (seg.get("recovery", {}) or {}).get("parties", []) or []

        def _n(x):
            try:
                return float(x or 0)
            except (TypeError, ValueError):
                return 0.0

        daily = _n(bh.get("daily_copies"))
        last_year = _n(bh.get("last_year_copies"))
        revenue = _n(bh.get("monthly_revenue"))
        outstanding = _n(bh.get("outstanding"))
        target = _n(adv.get("target"))
        achievement = _n(adv.get("achievement"))

        total_daily += daily
        total_last_year += last_year
        total_revenue += revenue
        total_outstanding += outstanding
        total_ad_target += target
        total_ad_achievement += achievement

        weak = [w for w in (circ.get("weak_agents") or []) if (w or {}).get("agent_name")]
        weak_agents_count += len(weak)
        lost = [c for c in (adv.get("lost_clients") or []) if (c or {}).get("client")]
        lost_clients_count += len(lost)

        branch_party_outstanding = 0
        for r in rec:
            age = _n((r or {}).get("ageing"))
            amt = _n((r or {}).get("outstanding"))
            branch_party_outstanding += amt
            if age <= 30:
                ageing_buckets["0-30"] += amt
            elif age <= 60:
                ageing_buckets["31-60"] += amt
            elif age <= 90:
                ageing_buckets["61-90"] += amt
            else:
                ageing_buckets["90+"] += amt
        parties_total_outstanding += branch_party_outstanding

        by_branch.append({
            "visit_id": v.get("id"),
            "branch": v.get("branch_name"),
            "visit_date": v.get("visit_date"),
            "owner": v.get("created_by_name"),
            "daily_copies": daily,
            "last_year_copies": last_year,
            "growth_pct": (((daily - last_year) / last_year) * 100) if last_year else None,
            "monthly_revenue": revenue,
            "outstanding": outstanding,
            "ad_target": target,
            "ad_achievement": achievement,
            "weak_agents": len(weak),
            "lost_clients": len(lost),
            "recovery_outstanding": branch_party_outstanding,
        })

    growth_pct = ((total_daily - total_last_year) / total_last_year * 100) if total_last_year else None
    ad_achievement_pct = (total_ad_achievement / total_ad_target * 100) if total_ad_target else None

    return {
        "scope": "admin_all" if (user["role"] == "admin" and not user_id) else
                 "admin_user" if user["role"] == "admin" else "self",
        "visit_count": len(visits),
        "filter_user_id": user_id if user["role"] == "admin" else user["id"],
        "kpis": {
            "total_daily_copies": total_daily,
            "total_last_year_copies": total_last_year,
            "growth_pct": growth_pct,
            "total_monthly_revenue": total_revenue,
            "total_outstanding": total_outstanding,
            "total_ad_target": total_ad_target,
            "total_ad_achievement": total_ad_achievement,
            "ad_achievement_pct": ad_achievement_pct,
            "weak_agents_count": weak_agents_count,
            "lost_clients_count": lost_clients_count,
            "parties_outstanding": parties_total_outstanding,
        },
        "ageing_buckets": ageing_buckets,
        "by_branch": by_branch,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
