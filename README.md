# NammaFix 🔥 — Citizen-to-Government Complaint Platform

> *"Every broken road has a name on it. NammaFix makes sure everyone can see it."*

**Team nammaFix | IBM BoBathon Hackathon 2026**

---

## 🎯 What It Does

NammaFix is a real-time civic complaint platform for Bengaluru citizens that:

- Lets citizens **file complaints in <30 seconds** with photo + location
- Uses **IBM watsonx AI** to auto-classify: type, severity, responsible department
- **Auto-escalates** unresolved issues up the accountability chain (BBMP → Corporator → MLA → Public Shame Board)
- Shows **live public scorecards** for every Corporator and MLA
- Lets neighbours **upvote** issues to amplify priority
- Gives **CC your MLA** one-tap escalation with AI-generated briefings

---

## 🚀 Quick Start

### Frontend (React + Vite + Tailwind)
```bash
cd nammafix
npm install
npm run dev
# → http://localhost:5173
```

### Backend (FastAPI + Python)
```bash
cd nammafix/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

---

## 📱 App Pages

| Route | Description |
|---|---|
| `/dashboard` | City dashboard — live map, ward scoreboard, complaint feed, MLA scorecards |
| `/file` | Multi-step complaint filing with AI classification |
| `/complaints/:id` | Complaint detail — escalation ladder, upvote, CC MLA, comments |
| `/corporator/:id` | Corporator dashboard — complaint queue, scorecard, performance charts |
| `/scoreboard` | Public accountability leaderboard — all corporators and MLAs ranked |

---

## 🗺️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind v4 |
| Maps | Leaflet.js + react-leaflet (CircleMarkers colored by severity) |
| Backend | Python FastAPI + Pydantic + Uvicorn |
| AI (mock) | Keyword-based classification endpoint → real watsonx.ai integration ready |
| Icons | lucide-react |
| Routing | react-router-dom v7 |

---

## 🧠 Escalation Engine

```
L1: BBMP Officer          → 48 hrs SLA
L2: Ward Corporator       → if unresolved
L3: Zonal Commissioner    → after 7 days
L4: MLA                   → if 20+ upvotes
L5: Public Shame Board    → city dashboard highlight
```

Auto-escalation runs on every API GET request — no cron job needed for demo.

---

## 🔌 API Reference

```
GET  /api/complaints          # list all (filter: ?ward=&status=&type=)
GET  /api/complaints/:id      # single complaint
POST /api/complaints          # file new complaint
POST /api/complaints/:id/upvote    # upvote
POST /api/complaints/:id/cc-mla    # CC your MLA
POST /api/complaints/:id/resolve   # mark resolved

GET  /api/corporators         # all corporators with live stats
GET  /api/mlas                # all MLAs
GET  /api/stats               # citywide dashboard stats

POST /api/ai/classify         # AI classification: {description, photo_url}
```

---

## 📊 Seed Data

5 real Bangalore wards (Koramangala, Indiranagar, Jayanagar, Shivajinagar, Hebbal) with:
- 5 Corporators with live resolution scorecards
- 3 MLAs (South, Central, North constituencies)
- 7 complaints seeded across potholes, flooding, streetlights, garbage, sewage, trees

---

## 🏆 Hackathon Demo Script (5 min)

1. **City Dashboard** — live map with 7 colored pins, ward scorecards, MLA accountability
2. **File a Complaint** — upload photo → AI classifies in 2s → place pin on map → submit
3. **Complaint Detail** — escalation ladder, upvote counter, CC MLA button
4. **Corporator Dashboard** — complaint queue, performance chart, action buttons
5. **Scoreboard** — public accountability table, shame board highlight

---

Built with ❤️ using **IBM Bob** at **BoBathon 2026**
