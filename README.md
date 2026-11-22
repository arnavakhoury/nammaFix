# Nagawara Traffic Dashboard + NammaFix

> **BoBathon 2026** — Merged Solution: Real-time junction management + citizen civic reporting

---

## What This Is

A single-page, zero-build dashboard that combines two systems:

| System | What it does |
|---|---|
| **Nagawara Traffic Dashboard** | Real-time traffic signals, vehicle density, 5km traveller alerts, GPS sensors, route advisor for Nagawara Junction, Bangalore |
| **NammaFix** (by arnavakhoury) | Citizen complaint filing, ward accountability scorecards, escalation engine, AI classification — for BBMP Bangalore |

---

## How They're Connected

Every ward surrounding Nagawara Junction feeds into one of its four arms:

| Junction Arm | Ward | NammaFix Data |
|---|---|---|
| North · Hebbal | Ward 6 — Hebbal | Corporator Ramesh Gowda |
| South · RT Nagar | Ward 5 — RT Nagar | Corporator Latha Venkatesh |
| East · Kalyan Nagar | Ward 85 — Kalyan Nagar | Corporator Suresh Rao |
| West · Manyata | Ward 7 — Thanisandra + Ward 110 — Kogilu | Corporator Divya Krishnan / Bharath Nair |

**Road issues filed by citizens (potholes, sewage, flooding, fallen trees) are shown with their direct traffic impact on the live junction density for that arm.**

---

## Merged Features

- 🚦 Live traffic signal control (adaptive / manual)
- 📡 Real-time vehicle density per arm with animated bar charts
- 🗺️ 5 km traveller alert radius map with per-traveller broadcast log
- 🛣️ Route advisor (2W / 4W) with ETA per segment
- 📍 GPS sensor panel (4 sensors, one per arm entrance)
- 📋 **[NEW] NammaFix civic issue feed** — 7 seed complaints, all linked to junction arm density
- 📊 **[NEW] Ward accountability scoreboard** — resolve rates, SLA breaches, shame board
- ✍️ **[NEW] Citizen complaint filing panel** — type, severity, arm, AI classification mock, submits to live feed
- 👍 **[NEW] Upvote system** with SLA breach and escalation badges

---

## Running It

```
cd nagawara-traffic-dashboard
double-click "START HERE.bat"
```

Or:
```powershell
cd nagawara-traffic-dashboard
powershell -f start-server.ps1
# Opens at http://localhost:8080
```

No npm, no build, no install — pure HTML + React via CDN libs.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | React 18 (dev build via CDN) + Babel in-browser transpile |
| Language | JSX (compiled in-browser by Babel standalone) |
| Styling | Inline CSS (single `<style>` block) |
| Data | Simulated sensors + NammaFix seed data, all in-memory |
| Backend | None required for demo |

---

Built with ❤️ using **IBM Bob** at **BoBathon 2026**  
Integrates: [nammaFix](https://github.com/arnavakhoury/nammaFix) by @arnavakhoury
