"""
NammaFix FastAPI backend
Run: uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------

app = FastAPI(title="NammaFix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Type aliases (string literals)
# ---------------------------------------------------------------------------

Severity = Literal["critical", "high", "medium", "low"]
IssueType = Literal["pothole", "streetlight", "garbage", "flooding", "encroachment", "sewage", "tree", "other"]
ComplaintStatus = Literal["open", "assigned", "in_progress", "resolved", "escalated"]

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class CorporatorOut(BaseModel):
    id: str
    name: str
    ward: int
    wardName: str
    party: str
    phone: str
    email: str
    photo: str
    resolvedOnTime: int
    totalComplaints: int
    pendingOver7Days: int
    ignoredOver30Days: int
    rating: float
    trend: Literal["up", "down", "stable"]
    since: str
    # live stats added at query time
    openComplaints: int = 0
    resolveRate: int = 0


class MLAOut(BaseModel):
    id: str
    name: str
    constituency: str
    party: str
    photo: str
    rating: float
    totalComplaints: int
    resolvedRate: int


class ComplaintOut(BaseModel):
    id: str
    title: str
    description: str
    type: IssueType
    severity: Severity
    status: ComplaintStatus
    wardId: int
    wardName: str
    lat: float
    lng: float
    address: str
    upvotes: int
    comments: int
    filedAt: str
    resolvedAt: Optional[str] = None
    escalationLevel: int
    corporatorId: str
    mlaId: str
    photoUrl: str
    afterPhotoUrl: Optional[str] = None
    reporterName: str
    aiClassification: Optional[str] = None
    ccedMLA: bool
    slaHours: int
    hoursElapsed: int


class ComplaintCreate(BaseModel):
    title: str
    description: str
    type: IssueType
    address: str
    lat: float
    lng: float
    wardId: int
    wardName: str
    photoUrl: str = ""
    reporterName: str = "Anonymous"


class UpvoteResponse(BaseModel):
    id: str
    upvotes: int


class AiClassifyRequest(BaseModel):
    description: str
    photo_url: str = ""


class AiClassifyResponse(BaseModel):
    type: IssueType
    severity: Severity
    ward_guess: Optional[str]
    department: str
    confidence: float
    ai_summary: str


class WardStat(BaseModel):
    wardId: int
    wardName: str
    openComplaints: int
    resolvedComplaints: int
    criticalCount: int
    resolveRate: int


class TopIssue(BaseModel):
    type: str
    count: int


class StatsResponse(BaseModel):
    total_open: int
    total_resolved: int
    critical_count: int
    by_ward: List[WardStat]
    top_issues: List[TopIssue]


# ---------------------------------------------------------------------------
# In-memory seed data (mirrors data.ts exactly)
# ---------------------------------------------------------------------------

_CORPORATORS_RAW: list[dict] = [
    {
        "id": "corp-42", "name": "Suresh Kumar", "ward": 42, "wardName": "Koramangala",
        "party": "INC", "phone": "+91 98451 23456", "email": "suresh.kumar@bbmp.gov.in",
        "photo": "https://i.pravatar.cc/150?img=11",
        "resolvedOnTime": 28, "totalComplaints": 47, "pendingOver7Days": 12,
        "ignoredOver30Days": 7, "rating": 3.1, "trend": "down", "since": "2020",
    },
    {
        "id": "corp-15", "name": "Anita Reddy", "ward": 15, "wardName": "Indiranagar",
        "party": "BJP", "phone": "+91 98452 34567", "email": "anita.reddy@bbmp.gov.in",
        "photo": "https://i.pravatar.cc/150?img=25",
        "resolvedOnTime": 54, "totalComplaints": 59, "pendingOver7Days": 3,
        "ignoredOver30Days": 2, "rating": 4.6, "trend": "up", "since": "2018",
    },
    {
        "id": "corp-67", "name": "Mohammed Rafi", "ward": 67, "wardName": "Shivajinagar",
        "party": "AIMIM", "phone": "+91 98453 45678", "email": "rafi.m@bbmp.gov.in",
        "photo": "https://i.pravatar.cc/150?img=33",
        "resolvedOnTime": 7, "totalComplaints": 30, "pendingOver7Days": 18,
        "ignoredOver30Days": 5, "rating": 1.9, "trend": "down", "since": "2022",
    },
    {
        "id": "corp-28", "name": "Priya Nair", "ward": 28, "wardName": "Jayanagar",
        "party": "JD(S)", "phone": "+91 98454 56789", "email": "priya.nair@bbmp.gov.in",
        "photo": "https://i.pravatar.cc/150?img=47",
        "resolvedOnTime": 41, "totalComplaints": 52, "pendingOver7Days": 7,
        "ignoredOver30Days": 4, "rating": 3.8, "trend": "stable", "since": "2020",
    },
    {
        "id": "corp-05", "name": "Ramesh Gowda", "ward": 5, "wardName": "Hebbal",
        "party": "BJP", "phone": "+91 98455 67890", "email": "ramesh.gowda@bbmp.gov.in",
        "photo": "https://i.pravatar.cc/150?img=52",
        "resolvedOnTime": 48, "totalComplaints": 55, "pendingOver7Days": 5,
        "ignoredOver30Days": 2, "rating": 4.2, "trend": "up", "since": "2018",
    },
]

_MLAS_RAW: list[dict] = [
    {
        "id": "mla-blr-south", "name": "Ravi Subramanya", "constituency": "Bangalore South",
        "party": "INC", "photo": "https://i.pravatar.cc/150?img=60",
        "rating": 3.4, "totalComplaints": 234, "resolvedRate": 61,
    },
    {
        "id": "mla-blr-central", "name": "Kavitha Devi", "constituency": "Bangalore Central",
        "party": "BJP", "photo": "https://i.pravatar.cc/150?img=45",
        "rating": 4.1, "totalComplaints": 187, "resolvedRate": 78,
    },
    {
        "id": "mla-blr-north", "name": "Prakash Hegde", "constituency": "Bangalore North",
        "party": "JD(S)", "photo": "https://i.pravatar.cc/150?img=70",
        "rating": 2.8, "totalComplaints": 312, "resolvedRate": 44,
    },
]

_COMPLAINTS_SEED: list[dict] = [
    {
        "id": "cmp-001", "title": "Large pothole near Sony World Signal",
        "description": "Dangerous pothole 2ft wide on 80ft road near Sony World junction. Multiple vehicles damaged. Exists since 3 weeks.",
        "type": "pothole", "severity": "critical", "status": "escalated",
        "wardId": 42, "wardName": "Koramangala", "lat": 12.9352, "lng": 77.6245,
        "address": "80 Feet Rd, Sony World Junction, Koramangala",
        "upvotes": 47, "comments": 12, "filedAt": "2026-11-19T08:30:00Z",
        "resolvedAt": None, "escalationLevel": 3,
        "corporatorId": "corp-42", "mlaId": "mla-blr-south",
        "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Pothole_in_road.jpg/640px-Pothole_in_road.jpg",
        "reporterName": "Kiran S.",
        "aiClassification": "Pothole — Severity: Critical — Ward 42 — BBMP Roads Division",
        "ccedMLA": True, "slaHours": 48, "hoursElapsed": 72,
    },
    {
        "id": "cmp-002", "title": "Streetlight out for 2 weeks — MG Road stretch",
        "description": "6 consecutive streetlights not working from MG Road metro to Trinity Circle. Dangerous at night.",
        "type": "streetlight", "severity": "high", "status": "assigned",
        "wardId": 28, "wardName": "Jayanagar", "lat": 12.9757, "lng": 77.6082,
        "address": "MG Road, near Trinity Circle, Bangalore",
        "upvotes": 31, "comments": 8, "filedAt": "2026-11-18T14:00:00Z",
        "resolvedAt": None, "escalationLevel": 2,
        "corporatorId": "corp-28", "mlaId": "mla-blr-central",
        "photoUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640",
        "reporterName": "Deepa M.",
        "aiClassification": "Streetlight Outage — Severity: High — Ward 28 — BESCOM",
        "ccedMLA": False, "slaHours": 72, "hoursElapsed": 56,
    },
    {
        "id": "cmp-003", "title": "Overflowing garbage — HSR Layout Sector 2",
        "description": "BBMP collection truck hasn't come in 4 days. Garbage overflowing, stray animals. Breeding mosquitoes.",
        "type": "garbage", "severity": "high", "status": "in_progress",
        "wardId": 15, "wardName": "Indiranagar", "lat": 12.9121, "lng": 77.6446,
        "address": "HSR Layout Sector 2, 27th Main, Bangalore",
        "upvotes": 28, "comments": 15, "filedAt": "2026-11-20T09:15:00Z",
        "resolvedAt": None, "escalationLevel": 2,
        "corporatorId": "corp-15", "mlaId": "mla-blr-south",
        "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Garbage_pile_Bangalore.jpg/640px-Garbage_pile_Bangalore.jpg",
        "reporterName": "Ajay K.",
        "aiClassification": "Garbage Overflow — Severity: High — Ward 15 — BBMP Solid Waste",
        "ccedMLA": False, "slaHours": 24, "hoursElapsed": 29,
    },
    {
        "id": "cmp-004", "title": "Flooding at underpass — Silk Board Junction",
        "description": "Silk Board underpass floods every time it rains. 3 feet of water. Completely blocks traffic for hours.",
        "type": "flooding", "severity": "critical", "status": "escalated",
        "wardId": 67, "wardName": "Shivajinagar", "lat": 12.9176, "lng": 77.6224,
        "address": "Silk Board Junction, Electronic City Flyover, Bangalore",
        "upvotes": 89, "comments": 34, "filedAt": "2026-11-17T06:00:00Z",
        "resolvedAt": None, "escalationLevel": 4,
        "corporatorId": "corp-67", "mlaId": "mla-blr-south",
        "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Road_Flooded.jpg/640px-Road_Flooded.jpg",
        "reporterName": "Raghavendra P.",
        "aiClassification": "Flooding — Severity: Critical — Ward 67 — BBMP Drainage + BWSSB",
        "ccedMLA": True, "slaHours": 24, "hoursElapsed": 120,
    },
    {
        "id": "cmp-005", "title": "Broken footpath — Indiranagar 100ft Road",
        "description": "Tiles completely broken on 100ft Road footpath. Senior citizens and children tripping. Encroached by shop.",
        "type": "encroachment", "severity": "medium", "status": "open",
        "wardId": 15, "wardName": "Indiranagar", "lat": 12.9784, "lng": 77.6408,
        "address": "100ft Road, Indiranagar, Bangalore",
        "upvotes": 22, "comments": 6, "filedAt": "2026-11-21T10:00:00Z",
        "resolvedAt": None, "escalationLevel": 1,
        "corporatorId": "corp-15", "mlaId": "mla-blr-central",
        "photoUrl": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640",
        "reporterName": "Sunita R.",
        "aiClassification": "Footpath Damage / Encroachment — Severity: Medium — Ward 15 — BBMP Engineering",
        "ccedMLA": False, "slaHours": 168, "hoursElapsed": 22,
    },
    {
        "id": "cmp-006", "title": "Sewage overflow — Hebbal Lake Road",
        "description": "Sewage overflowing onto road near Hebbal Lake. Foul smell, health hazard. BWSSB pipe burst.",
        "type": "sewage", "severity": "critical", "status": "in_progress",
        "wardId": 5, "wardName": "Hebbal", "lat": 13.0453, "lng": 77.5967,
        "address": "Hebbal Lake Road, near Flyover, Bangalore",
        "upvotes": 55, "comments": 20, "filedAt": "2026-11-21T07:30:00Z",
        "resolvedAt": None, "escalationLevel": 3,
        "corporatorId": "corp-05", "mlaId": "mla-blr-north",
        "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Sewage_overflow.jpg/640px-Sewage_overflow.jpg",
        "reporterName": "Nandini B.",
        "aiClassification": "Sewage Overflow — Severity: Critical — Ward 5 — BWSSB",
        "ccedMLA": True, "slaHours": 12, "hoursElapsed": 18,
    },
    {
        "id": "cmp-007", "title": "Fallen tree blocking road — Jayanagar 4th Block",
        "description": "Large tree fell during last night's storm. Completely blocks road. No BBMP response after 8 hours.",
        "type": "tree", "severity": "high", "status": "assigned",
        "wardId": 28, "wardName": "Jayanagar", "lat": 12.9279, "lng": 77.5825,
        "address": "4th Block, 11th Main, Jayanagar, Bangalore",
        "upvotes": 18, "comments": 7, "filedAt": "2026-11-22T01:00:00Z",
        "resolvedAt": None, "escalationLevel": 1,
        "corporatorId": "corp-28", "mlaId": "mla-blr-south",
        "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Fallen_tree.jpg/640px-Fallen_tree.jpg",
        "reporterName": "Vikram S.",
        "aiClassification": "Fallen Tree — Severity: High — Ward 28 — BBMP Horticulture",
        "ccedMLA": False, "slaHours": 6, "hoursElapsed": 8,
    },
]

# Mutable in-memory stores (deep-copied from seeds so mutation is safe)
db_complaints: list[dict] = [copy.deepcopy(c) for c in _COMPLAINTS_SEED]
db_corporators: list[dict] = [copy.deepcopy(c) for c in _CORPORATORS_RAW]
db_mlas: list[dict] = [copy.deepcopy(m) for m in _MLAS_RAW]

# ---------------------------------------------------------------------------
# SLA / auto-escalation helper
# ---------------------------------------------------------------------------

def _apply_escalation(complaint: dict) -> None:
    """Increment escalationLevel (max 5) when hoursElapsed > slaHours."""
    if complaint["status"] == "resolved":
        return
    if complaint["hoursElapsed"] > complaint["slaHours"]:
        complaint["escalationLevel"] = min(5, complaint["escalationLevel"] + 1)
        # promote status to escalated if not already past that
        if complaint["status"] not in ("escalated",):
            complaint["status"] = "escalated"


def _run_escalation_pass() -> None:
    for c in db_complaints:
        _apply_escalation(c)


# ---------------------------------------------------------------------------
# AI classification helper
# ---------------------------------------------------------------------------

_KEYWORD_MAP: list[tuple[list[str], str, str, str]] = [
    # keywords              type            severity   department
    (["pothole", "crater", "road damage", "road broken"],
     "pothole", "critical", "BBMP Roads Division"),
    (["streetlight", "light out", "dark road", "no light", "lamp"],
     "streetlight", "high", "BESCOM"),
    (["garbage", "waste", "trash", "refuse", "dump", "mosquito"],
     "garbage", "high", "BBMP Solid Waste"),
    (["flood", "flooding", "waterlog", "water stagnation", "overflow water"],
     "flooding", "critical", "BBMP Drainage + BWSSB"),
    (["encroach", "footpath", "pavement", "footway", "broken tiles"],
     "encroachment", "medium", "BBMP Engineering"),
    (["sewage", "sewer", "drain overflow", "drain blocked", "bwssb"],
     "sewage", "critical", "BWSSB"),
    (["tree", "fallen tree", "branch", "uprooted"],
     "tree", "high", "BBMP Horticulture"),
]


def _classify_description(description: str) -> tuple[str, str, str, float]:
    """Return (type, severity, department, confidence)."""
    desc_lower = description.lower()
    for keywords, issue_type, severity, department in _KEYWORD_MAP:
        for kw in keywords:
            if kw in desc_lower:
                return issue_type, severity, department, 0.87
    return "other", "medium", "BBMP General", 0.45


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _find_complaint(complaint_id: str) -> dict:
    for c in db_complaints:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found")


def _corp_live(corp: dict) -> dict:
    """Attach live openComplaints and resolveRate to a corporator dict."""
    out = copy.copy(corp)
    ward_complaints = [c for c in db_complaints if c["corporatorId"] == corp["id"]]
    out["openComplaints"] = sum(1 for c in ward_complaints if c["status"] != "resolved")
    total = corp["totalComplaints"]
    out["resolveRate"] = round((corp["resolvedOnTime"] / total) * 100) if total else 0
    return out


# ---------------------------------------------------------------------------
# Routes — Complaints
# ---------------------------------------------------------------------------

@app.get("/api/complaints", response_model=List[ComplaintOut])
def list_complaints(
    ward: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    _run_escalation_pass()
    result = db_complaints
    if ward is not None:
        result = [c for c in result if c["wardId"] == ward]
    if status:
        result = [c for c in result if c["status"] == status]
    if type:
        result = [c for c in result if c["type"] == type]
    return result


@app.get("/api/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str):
    _run_escalation_pass()
    return _find_complaint(complaint_id)


@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintCreate):
    new_id = f"cmp-{uuid.uuid4().hex[:8]}"
    complaint = {
        "id": new_id,
        "title": body.title,
        "description": body.description,
        "type": body.type,
        "severity": "medium",
        "status": "open",
        "wardId": body.wardId,
        "wardName": body.wardName,
        "lat": body.lat,
        "lng": body.lng,
        "address": body.address,
        "upvotes": 0,
        "comments": 0,
        "filedAt": _now_iso(),
        "resolvedAt": None,
        "escalationLevel": 1,
        "corporatorId": "",
        "mlaId": "",
        "photoUrl": body.photoUrl,
        "afterPhotoUrl": None,
        "reporterName": body.reporterName,
        "aiClassification": None,
        "ccedMLA": False,
        "slaHours": 48,
        "hoursElapsed": 0,
    }
    # auto-assign corporator by ward
    for corp in db_corporators:
        if corp["ward"] == body.wardId:
            complaint["corporatorId"] = corp["id"]
            break
    db_complaints.append(complaint)
    return complaint


@app.post("/api/complaints/{complaint_id}/upvote", response_model=UpvoteResponse)
def upvote_complaint(complaint_id: str):
    complaint = _find_complaint(complaint_id)
    complaint["upvotes"] += 1
    return {"id": complaint_id, "upvotes": complaint["upvotes"]}


@app.post("/api/complaints/{complaint_id}/cc-mla", response_model=ComplaintOut)
def cc_mla(complaint_id: str):
    complaint = _find_complaint(complaint_id)
    complaint["ccedMLA"] = True
    if complaint["upvotes"] >= 20:
        complaint["escalationLevel"] = min(5, complaint["escalationLevel"] + 1)
        complaint["status"] = "escalated"
    return complaint


@app.post("/api/complaints/{complaint_id}/resolve", response_model=ComplaintOut)
def resolve_complaint(complaint_id: str):
    complaint = _find_complaint(complaint_id)
    complaint["status"] = "resolved"
    complaint["resolvedAt"] = _now_iso()
    return complaint


# ---------------------------------------------------------------------------
# Routes — Corporators
# ---------------------------------------------------------------------------

@app.get("/api/corporators", response_model=List[CorporatorOut])
def list_corporators():
    return [_corp_live(c) for c in db_corporators]


@app.get("/api/corporators/{corporator_id}", response_model=CorporatorOut)
def get_corporator(corporator_id: str):
    for c in db_corporators:
        if c["id"] == corporator_id:
            return _corp_live(c)
    raise HTTPException(status_code=404, detail=f"Corporator '{corporator_id}' not found")


# ---------------------------------------------------------------------------
# Routes — MLAs
# ---------------------------------------------------------------------------

@app.get("/api/mlas", response_model=List[MLAOut])
def list_mlas():
    return db_mlas


@app.get("/api/mlas/{mla_id}", response_model=MLAOut)
def get_mla(mla_id: str):
    for m in db_mlas:
        if m["id"] == mla_id:
            return m
    raise HTTPException(status_code=404, detail=f"MLA '{mla_id}' not found")


# ---------------------------------------------------------------------------
# Routes — Stats
# ---------------------------------------------------------------------------

@app.get("/api/stats", response_model=StatsResponse)
def get_stats():
    _run_escalation_pass()
    total_open = sum(1 for c in db_complaints if c["status"] != "resolved")
    total_resolved = sum(1 for c in db_complaints if c["status"] == "resolved")
    critical_count = sum(1 for c in db_complaints if c["severity"] == "critical" and c["status"] != "resolved")

    # by_ward
    ward_map: dict[int, dict] = {}
    for c in db_complaints:
        wid = c["wardId"]
        if wid not in ward_map:
            ward_map[wid] = {
                "wardId": wid,
                "wardName": c["wardName"],
                "openComplaints": 0,
                "resolvedComplaints": 0,
                "criticalCount": 0,
            }
        if c["status"] == "resolved":
            ward_map[wid]["resolvedComplaints"] += 1
        else:
            ward_map[wid]["openComplaints"] += 1
            if c["severity"] == "critical":
                ward_map[wid]["criticalCount"] += 1

    by_ward: list[WardStat] = []
    for w in ward_map.values():
        total_w = w["openComplaints"] + w["resolvedComplaints"]
        resolve_rate = round((w["resolvedComplaints"] / total_w) * 100) if total_w else 0
        by_ward.append(WardStat(
            wardId=w["wardId"],
            wardName=w["wardName"],
            openComplaints=w["openComplaints"],
            resolvedComplaints=w["resolvedComplaints"],
            criticalCount=w["criticalCount"],
            resolveRate=resolve_rate,
        ))

    # top_issues
    type_counts: dict[str, int] = {}
    for c in db_complaints:
        type_counts[c["type"]] = type_counts.get(c["type"], 0) + 1
    top_issues = [
        TopIssue(type=t, count=n)
        for t, n in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return StatsResponse(
        total_open=total_open,
        total_resolved=total_resolved,
        critical_count=critical_count,
        by_ward=by_ward,
        top_issues=top_issues,
    )


# ---------------------------------------------------------------------------
# Routes — AI classify
# ---------------------------------------------------------------------------

@app.post("/api/ai/classify", response_model=AiClassifyResponse)
def ai_classify(body: AiClassifyRequest):
    issue_type, severity, department, confidence = _classify_description(body.description)

    type_labels = {
        "pothole": "Pothole", "streetlight": "Streetlight Outage",
        "garbage": "Garbage Overflow", "flooding": "Flooding",
        "encroachment": "Encroachment / Footpath Damage", "sewage": "Sewage Overflow",
        "tree": "Fallen Tree", "other": "General Issue",
    }
    label = type_labels.get(issue_type, "General Issue")
    ai_summary = (
        f"AI detected: {label}. "
        f"Estimated severity: {severity.capitalize()}. "
        f"Recommended department: {department}. "
        f"Confidence: {int(confidence * 100)}%."
    )

    return AiClassifyResponse(
        type=issue_type,
        severity=severity,
        ward_guess=None,
        department=department,
        confidence=confidence,
        ai_summary=ai_summary,
    )
