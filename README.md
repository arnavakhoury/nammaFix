# NammaFix 🔧 × Nagawara Traffic Dashboard 🚦

> *"Every broken road has a name on it. NammaFix makes sure everyone can see it — and now the junction knows about it in real-time."*

**Team nammaFix | IBM BoBathon Hackathon 2026**

---

## 🔀 Merged Solution

This repo combines two complementary systems into one integrated platform:

| System | What it does |
|---|---|
| **NammaFix** | Citizen-to-government civic complaint platform for Bengaluru — file issues, track accountability, escalate to MLA |
| **Nagawara Traffic Dashboard** | Real-time junction traffic management — live signals, vehicle density, 5km traveller alerts, GPS sensors, route advisor |

**How they connect:** Every ward surrounding Nagawara Junction feeds into one of its four arms. Citizen-reported road issues (potholes, sewage overflows, flooding, fallen trees) are now shown with their **direct live traffic impact** on the junction arm they affect.

| Junction Arm | Ward | Civic Data |
|---|---|---|
| North · Hebbal | Ward 6 — Hebbal | Corporator Ramesh Gowda |
| South · RT Nagar | Ward 5 — RT Nagar | Corporator Latha Venkatesh |
| East · Kalyan Nagar | Ward 85 — Kalyan Nagar | Corporator Suresh Rao |
| West · Manyata | Ward 7 — Thanisandra + Ward 110 — Kogilu | Corporator Divya Krishnan / Bharath Nair |

---

## 🚀 What It Does

### NammaFix (React + Vite app)
- Lets citizens **file complaints in <30 seconds** with photo + location
- Uses **IBM watsonx AI** to auto-classify: type, severity, responsible department
- **Auto-escalates** unresolved issues up the accountability chain (BBMP → Corporator → MLA → Public Shame Board)
- Shows **live public scorecards** for every Corporator and MLA
- Lets neighbours **upvote** issues to amplify priority
- **CC your MLA** one-tap escalation with AI-generated briefings

### Nagawara Traffic Dashboard (single-file HTML app)
- Live traffic signal control (adaptive / manual toggle)
- Real-time vehicle density per arm with animated charts
- 5 km traveller alert radius map with per-traveller broadcast log
- Route advisor (2W / 4W) with ETA per road segment
- GPS sensor panel (4 sensors, one per arm entrance)
- **[INTEGRATED] NammaFix civic issue feed** — complaints linked to live arm density
- **[INTEGRATED] Ward accountability scoreboard** — resolve rates, SLA breaches, shame board
- **[INTEGRATED] Citizen filing panel** — submit issues directly from the traffic dashboard

---

## ⚡ Quick Start

### NammaFix Frontend (React + Vite + Tailwind)
```bash
npm install
npm run dev
# → http://localhost:5173
```

### NammaFix Backend (FastAPI + Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### Nagawara Traffic Dashboard (zero install)
```
cd nagawara-traffic-dashboard
double-click "START HERE.bat"
# → http://localhost:8080
```

---

## 📱 App Pages (NammaFix)

| Route | Description |
|---|---|
| `/dashboard` | City dashboard — live map, ward scoreboard, complaint feed, MLA scorecards |
| `/file` | Multi-step complaint filing with AI classification |
| `/complaints/:id` | Complaint detail — escalation ladder, upvote, CC MLA, comments |
| `/corporator/:id` | Corporator dashboard — complaint queue, scorecard, performance charts |
| `/scoreboard` | Public accountability leaderboard — all corporators and MLAs ranked |

---

## 🛠️ Tech Stack

| Layer | NammaFix | Traffic Dashboard |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind v4 | React 18 (CDN) + Babel in-browser |
| Maps | Leaflet.js + react-leaflet | SVG (inline, custom) |
| Backend | Python FastAPI + Pydantic + Uvicorn | None required |
| AI | watsonx.ai classification (mock ready) | Keyword-based mock |
| Icons | lucide-react | SVG inline |
| Routing | react-router-dom v7 | Single page |

---

## 🔺 Escalation Engine (NammaFix)

```
L1: BBMP Officer          → 48 hrs SLA
L2: Ward Corporator       → if unresolved
L3: Zonal Commissioner    → after 7 days
L4: MLA                   → if 20+ upvotes
L5: Public Shame Board    → city dashboard highlight
```

Auto-escalation runs on every API GET request — no cron job needed for demo.

---

## 🌐 API Reference (NammaFix Backend)

```
GET  /api/complaints               # list all (filter: ?ward=&status=&type=)
GET  /api/complaints/:id           # single complaint
POST /api/complaints               # file new complaint
POST /api/complaints/:id/upvote    # upvote
POST /api/complaints/:id/cc-mla    # CC your MLA
POST /api/complaints/:id/resolve   # mark resolved
GET  /api/corporators              # all corporators with live stats
GET  /api/mlas                     # all MLAs
GET  /api/stats                    # citywide dashboard stats
POST /api/ai/classify              # AI classification: {description, photo_url}
```

---

## 📊 Seed Data

**NammaFix:** 5 real Bangalore wards (Koramangala, Indiranagar, Jayanagar, Shivajinagar, Hebbal) with 5 Corporators, 3 MLAs, 10 complaints.

**Traffic Dashboard:** Nagawara Junction (13.0475°N, 77.6219°E) with 20 simulated travellers within 5km, 4 GPS sensors, real Bangalore road/area names.

---

## 🎬 Hackathon Demo Script (5 min)

1. **Traffic Dashboard** — open `nagawara-traffic-dashboard/index.html`, show live signals + density
2. **NammaFix feed** — scroll to bottom, show civic complaints linked to junction arms with live density %
3. **File a complaint** — use the in-dashboard filing panel, submit, watch it appear in the feed
4. **NammaFix app** — `npm run dev`, show city map, ward scoreboard, MLA accountability
5. **Complaint Detail** — escalation ladder, upvote counter, CC MLA button
6. **Scoreboard** — public accountability table, shame board highlight

---

Built with ❤️ using **IBM Bob** at **BoBathon 2026**
