import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Gauge, MapPin, AlertTriangle, CheckCircle, Users, Activity,
  Plus, ChevronDown,
} from 'lucide-react';
import { COMPLAINTS, CORPORATORS } from '../data';

// ─── Junction Config ──────────────────────────────────────────────────────────
const JUNCTIONS = [
  { id: 'nagawara', name: 'Nagawara Junction', lat: 13.0453, lng: 77.5967, wards: [6, 85] },
];

const ARMS = [
  { id: 'north', name: 'North — Hebbal / ORR',        short: 'Hebbal',     color: '#3b82f6', angle: 270 },
  { id: 'south', name: 'South — RT Nagar',             short: 'RT Nagar',   color: '#a855f7', angle: 90  },
  { id: 'east',  name: 'East — Kalyan Nagar',          short: 'Kalyan Ngr', color: '#f59e0b', angle: 0   },
  { id: 'west',  name: 'West — Thanisandra / Manyata', short: 'Manyata',    color: '#22c55e', angle: 180 },
];

// ─── Static Data ──────────────────────────────────────────────────────────────
const ALT_ROUTES: Record<string, Record<string, { name: string; via: string; avoid: string }>> = {
  north: {
    '2w': { name: 'ORR Service Lane',      via: 'Nagavara Main → ORR Service Lane → Junction',   avoid: 'Avoid signal at Hebbal flyover junction' },
    '4w': { name: 'Elevated ORR Bypass',   via: 'ORR elevated → Esteem Mall exit → Nagawara',    avoid: 'Toll applicable; avoids surface-level congestion' },
    any:  { name: 'ORR Flyover Route',     via: 'Take ORR flyover approach, avoid Hebbal U-turn', avoid: 'Avoid left service road during peak hours' },
  },
  south: {
    '2w': { name: 'RT Nagar 1st Main 2W',  via: 'RT Nagar Circle → 1st Main → Nagawara',         avoid: 'Avoid MG Road flyover during 8–10 AM' },
    '4w': { name: 'Kammanahalli Bypass',   via: 'Kammanahalli Rd → 80ft Rd → Nagawara',          avoid: 'Avoid RT Nagar Main near school zone' },
    any:  { name: 'Aramane Nagar Cut',     via: 'Aramane Nagar → Cross → Nagawara Junction',     avoid: 'Avoid RT Nagar Main Road if density > 70%' },
  },
  east: {
    '2w': { name: 'HRBR Internal Bypass',  via: 'HRBR Layout → Internal Roads → Junction',       avoid: 'Avoid Kalyan Nagar 4th Block during rush hour' },
    '4w': { name: 'New Thippasandra Rd',   via: 'New Thippasandra → Old Airport Rd → Nagawara',  avoid: 'Avoid Horamavu Bridge Rd during 9–11 AM' },
    any:  { name: 'Banaswadi Cut-through', via: 'Banaswadi Rd → New Thippasandra → Junction',    avoid: 'Avoid Kalyan Nagar signal block near HRBR' },
  },
  west: {
    '2w': { name: 'Manyata 2W Inner Ring', via: 'Manyata Rd → Service Lane → Nagawara Cross',    avoid: 'Avoid Thanisandra Main near tech park gates 8–10 AM' },
    '4w': { name: 'ORR Manyata Exit',      via: 'Manyata Tech Park → ORR Exit → Nagawara Jn',   avoid: 'Avoid Kogilu Rd on Mon–Fri 6–8 PM' },
    any:  { name: 'Sahakara Nagar Cross',  via: 'Sahakara Nagar → Kogilu Cross → Junction',      avoid: 'Avoid Thanisandra Main Road during peak hours' },
  },
};

const GPS_SENSOR_BASE = [
  { armId: 'north', name: 'GPS-N01 · Hebbal Flyover',   lat: 13.0519, lng: 77.6212, headingLabel: 'S → Junction' },
  { armId: 'south', name: 'GPS-S02 · RT Nagar Circle',  lat: 13.0432, lng: 77.6225, headingLabel: 'N → Junction' },
  { armId: 'east',  name: 'GPS-E03 · Kalyan Nagar Rd',  lat: 13.0471, lng: 77.6281, headingLabel: 'W → Junction' },
  { armId: 'west',  name: 'GPS-W04 · Thanisandra Main', lat: 13.0479, lng: 77.6157, headingLabel: 'E → Junction' },
];

const SEGMENTS_DEF: Record<string, { label: string; desc: string }[]> = {
  north: [
    { label: '0–1.5 km', desc: 'Near Junction' },
    { label: '1.5–3 km', desc: 'Nagavara Main' },
    { label: '3–5 km',   desc: 'Hebbal ORR'    },
  ],
  south: [
    { label: '0–1.5 km', desc: 'Near Junction' },
    { label: '1.5–3 km', desc: 'RT Nagar Main' },
    { label: '3–5 km',   desc: 'Dollars Colony'},
  ],
  east: [
    { label: '0–1.5 km', desc: 'Near Junction' },
    { label: '1.5–3 km', desc: 'HRBR Layout'   },
    { label: '3–5 km',   desc: 'Banaswadi Rd'  },
  ],
  west: [
    { label: '0–1.5 km', desc: 'Near Junction' },
    { label: '1.5–3 km', desc: 'Manyata Rd'    },
    { label: '3–5 km',   desc: 'Sahakara Nagar'},
  ],
};

const ROUTE_OPTIONS: Record<string, Record<string, { name: string; via: string; dist: number; coeff: number; note: string }[]>> = {
  north: {
    '2w': [
      { name: 'Service Lane + Flyover',     via: 'Nagavara Main → ORR Service Lane',      dist: 4.2, coeff: 0.9,  note: '2W lane all the way, avoid signal queue' },
      { name: 'Thanisandra Cross Shortcut', via: 'Lottegollahalli → Cross Rd → Junction', dist: 5.1, coeff: 1.1,  note: 'Avoid at peak hours; narrow lanes' },
      { name: 'Direct Hebbal Rd',           via: 'Hebbal Main Road straight',              dist: 3.9, coeff: 1.3,  note: 'Fastest distance but high signal density' },
    ],
    '4w': [
      { name: 'ORR Main Carriageway',       via: 'Outer Ring Road → Nagawara Flyover',    dist: 4.5, coeff: 1.0,  note: 'Wide 3-lane road, good for cars' },
      { name: 'Elevated Corridor Bypass',   via: 'ORR elevated → Esteem Mall exit',       dist: 5.2, coeff: 0.85, note: 'Toll applies, fastest overall for cars' },
      { name: 'Nagavara Main Rd',           via: 'Via Nagavara Lake Road',                dist: 4.1, coeff: 1.4,  note: 'Narrow near school zone, avoid 8–9 AM' },
    ],
  },
  south: {
    '2w': [
      { name: 'RT Nagar 1st Main 2W Lane',  via: 'RT Nagar Circle → 1st Main → Junction', dist: 3.2, coeff: 0.85, note: 'Dedicated 2W lane, low signal stops' },
      { name: 'Aramane Nagar Shortcut',     via: 'Aramane Nagar → Cross → Junction',      dist: 3.8, coeff: 1.0,  note: 'Internal road, smooth for bikes' },
      { name: 'MG Road Connector',          via: 'MG Road → RT Nagar Main',               dist: 4.6, coeff: 1.2,  note: 'Longer but avoids school zone' },
    ],
    '4w': [
      { name: 'RT Nagar Main Road',         via: 'RT Nagar Main → Nagawara',              dist: 3.5, coeff: 1.1,  note: 'Standard 4W route, 2 signals' },
      { name: 'Kammanahalli Cut-through',   via: 'Kammanahalli Rd → Nagawara',            dist: 4.0, coeff: 0.9,  note: 'Less congested, good road surface' },
      { name: 'Dollars Colony Bypass',      via: 'Dollars Colony → 80 Feet Rd',          dist: 4.8, coeff: 0.8,  note: 'Wider road, recommended for heavy vehicles' },
    ],
  },
  east: {
    '2w': [
      { name: 'HRBR 2W Bypass',            via: 'HRBR Layout → Internal → Junction',     dist: 2.8, coeff: 0.8,  note: 'Two-wheeler shortcut, saves 5–8 min' },
      { name: 'Kalyan Nagar Main 2W',       via: 'Kalyan Nagar 4th Block → Junction',     dist: 3.1, coeff: 0.95, note: '2W lane painted, follow lane markings' },
      { name: 'Banaswadi Rd',               via: 'Banaswadi → New Thippasandra',          dist: 3.9, coeff: 1.1,  note: 'Longer but avoids HRBR congestion' },
    ],
    '4w': [
      { name: 'Kalyan Nagar 80ft Road',     via: '80ft Rd → Kalyan Nagar Cross',          dist: 3.3, coeff: 1.0,  note: 'Wide road, good signal coordination' },
      { name: 'New Thippasandra Rd',        via: 'New Thippasandra → Old Airport Rd',    dist: 3.7, coeff: 0.9,  note: 'Less congested during 9–11 AM' },
      { name: 'Horamavu Bridge Rd',         via: 'Horamavu → Kalyan Nagar',               dist: 4.4, coeff: 1.15, note: 'Avoid during Horamavu peak hours' },
    ],
  },
  west: {
    '2w': [
      { name: 'Manyata 2W Inner Ring',      via: 'Manyata Rd → Service Lane → Junction', dist: 2.5, coeff: 0.8,  note: 'Dedicated 2W corridor inside Manyata' },
      { name: 'Sahakara Nagar Cross',       via: 'Sahakara Nagar → Kogilu Cross',         dist: 3.4, coeff: 1.0,  note: 'Quiet internal road, recommended for bikes' },
      { name: 'Thanisandra Main Rd',        via: 'Thanisandra Main → Nagawara Cross',     dist: 2.9, coeff: 1.2,  note: 'High footfall near tech parks 8–10 AM' },
    ],
    '4w': [
      { name: 'Thanisandra Rd Direct',      via: 'Thanisandra Main → Nagawara',           dist: 3.0, coeff: 1.0,  note: 'Standard car route, 3 signals' },
      { name: 'ORR Manyata Exit',           via: 'Manyata Tech Park → ORR Exit → Jn',    dist: 3.8, coeff: 0.85, note: 'Recommended for office-hour traffic' },
      { name: 'Kogilu–Hennur Bypass',       via: 'Kogilu Rd → Hennur Cross → Junction',  dist: 4.2, coeff: 0.9,  note: 'Wide road, avoid Mon–Fri 6–8 PM' },
    ],
  },
};

const TRAVELLER_SEEDS = [
  { name: 'Arjun S.',    arm: 'north', dist: 1.2, bearing: 350, area: 'Hebbal'          },
  { name: 'Priya R.',    arm: 'north', dist: 2.8, bearing: 340, area: 'Esteem Mall'     },
  { name: 'Mohammed K.', arm: 'north', dist: 4.5, bearing: 355, area: 'Nagavara Lake'   },
  { name: 'Deepa N.',    arm: 'east',  dist: 0.9, bearing: 60,  area: 'Kalyan Nagar'    },
  { name: 'Rahul T.',    arm: 'east',  dist: 2.1, bearing: 75,  area: 'HRBR Layout'     },
  { name: 'Sneha M.',    arm: 'east',  dist: 3.7, bearing: 55,  area: 'Banaswadi'       },
  { name: 'Kiran B.',    arm: 'east',  dist: 4.9, bearing: 80,  area: 'Horamavu'        },
  { name: 'Lakshmi V.',  arm: 'west',  dist: 1.4, bearing: 190, area: 'Thanisandra'     },
  { name: 'Suresh P.',   arm: 'west',  dist: 2.6, bearing: 200, area: 'Manyata Tech Pk' },
  { name: 'Anjali C.',   arm: 'west',  dist: 3.3, bearing: 185, area: 'Kogilu'          },
  { name: 'Vikram H.',   arm: 'west',  dist: 4.7, bearing: 210, area: 'Sahakara Nagar'  },
  { name: 'Meera J.',    arm: 'south', dist: 1.0, bearing: 170, area: 'RT Nagar'        },
  { name: 'Arun G.',     arm: 'south', dist: 2.4, bearing: 160, area: 'Dollars Colony'  },
  { name: 'Fatima Z.',   arm: 'south', dist: 3.8, bearing: 175, area: 'Aramane Nagar'   },
  { name: 'Naveen D.',   arm: 'south', dist: 4.3, bearing: 155, area: 'Kammanahalli'    },
  { name: 'Pooja S.',    arm: 'north', dist: 3.1, bearing: 10,  area: 'Jakkur'          },
  { name: 'Ravi K.',     arm: 'east',  dist: 1.6, bearing: 45,  area: 'New Thippasandra'},
  { name: 'Divya L.',    arm: 'west',  dist: 0.7, bearing: 220, area: 'Nagawara Cross'  },
  { name: 'Santhosh M.', arm: 'south', dist: 2.0, bearing: 145, area: 'RMV 2nd Stage'   },
  { name: 'Bharathi R.', arm: 'north', dist: 1.8, bearing: 5,   area: 'Lottegollahalli' },
];

const AVATAR_COLORS = ['#3b82f6','#a855f7','#f59e0b','#22c55e','#ef4444','#06b6d4','#f97316','#8b5cf6','#10b981','#ec4899'];

const NF_WARDS = [
  { ward: 6,   wardName: 'Hebbal',        corpName: 'Ramesh Gowda',    party: 'BJP', resolvedOnTime: 48, total: 55, pendingOver7: 5,  rating: 4.2, arm: 'north', resolveRate: 87 },
  { ward: 7,   wardName: 'Thanisandra',   corpName: 'Divya Krishnan',  party: 'INC', resolvedOnTime: 22, total: 44, pendingOver7: 16, rating: 2.7, arm: 'west',  resolveRate: 50 },
  { ward: 85,  wardName: 'Kalyan Nagar',  corpName: 'Suresh Rao',      party: 'JD(S)', resolvedOnTime: 39, total: 53, pendingOver7: 10, rating: 3.6, arm: 'east', resolveRate: 74 },
  { ward: 5,   wardName: 'RT Nagar',      corpName: 'Latha Venkatesh', party: 'INC', resolvedOnTime: 35, total: 61, pendingOver7: 14, rating: 3.4, arm: 'south', resolveRate: 57 },
  { ward: 110, wardName: 'Manyata/Kogilu',corpName: 'Bharath Nair',    party: 'BJP', resolvedOnTime: 41, total: 52, pendingOver7: 7,  rating: 3.8, arm: 'west',  resolveRate: 79 },
];

const NF_ARM_LABELS: Record<string, string> = {
  north: 'North · Hebbal',
  south: 'South · RT Nagar',
  east: 'East · Kalyan Nagar',
  west: 'West · Manyata',
};

const NF_ARM_COLORS: Record<string, string> = {
  north: '#3b82f6',
  south: '#a855f7',
  east: '#f59e0b',
  west: '#22c55e',
};

const NF_ISSUE_ICONS: Record<string, string> = {
  pothole: '🕳️', streetlight: '💡', garbage: '🗑️', flooding: '🌊',
  encroachment: '⛔', sewage: '🚰', tree: '🌳', other: '❓',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function densityColor(pct: number) {
  if (pct < 40) return '#22c55e';
  if (pct < 70) return '#fbbf24';
  return '#ef4444';
}

function densityLabel(pct: number) {
  if (pct < 40) return { text: 'Low',    cls: 'bg-green-900 text-green-400'  };
  if (pct < 70) return { text: 'Medium', cls: 'bg-yellow-900 text-yellow-400' };
  return             { text: 'High',   cls: 'bg-red-900 text-red-400'    };
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function polarToSVG(bearing: number, distKm: number, cx: number, cy: number, maxKm: number, R: number) {
  const rad = ((bearing - 90) * Math.PI) / 180;
  const r = (distKm / maxKm) * R;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── Sensor Simulators ────────────────────────────────────────────────────────
interface ArmDensity { id: string; name: string; short: string; color: string; angle: number; count: number; pct: number }

function generateSensorData(prev: ArmDensity[] | null): ArmDensity[] {
  return ARMS.map((arm, i) => {
    const prevCount = prev ? prev[i].count : rand(30, 90);
    const delta = rand(-12, 14);
    const count = Math.max(5, Math.min(120, prevCount + delta));
    const pct = Math.round((count / 120) * 100);
    return { ...arm, count, pct };
  });
}

interface GpsSensor {
  armId: string; name: string; lat: number; lng: number; headingLabel: string;
  speed: number; satellites: number; accuracy: number; locked: boolean; updatedAt: number;
}

function generateGpsReadings(prev: GpsSensor[] | null): GpsSensor[] {
  return GPS_SENSOR_BASE.map((s, i) => {
    const prevSpeed = prev ? prev[i].speed : rand(8, 35);
    const speed = Math.max(2, Math.min(50, prevSpeed + rand(-6, 6)));
    const latDrift = (Math.random() - 0.5) * 0.0001;
    const lngDrift = (Math.random() - 0.5) * 0.0001;
    const satellites = rand(6, 12);
    const accuracy = +(Math.random() * 3 + 1).toFixed(1);
    const locked = satellites >= 7;
    return { ...s, speed, lat: +(s.lat + latDrift).toFixed(6), lng: +(s.lng + lngDrift).toFixed(6), satellites, accuracy, locked, updatedAt: Date.now() };
  });
}

interface SegmentEntry { label: string; desc: string; speed: number; flow: string; armId: string }

function generateSegmentData(densities: ArmDensity[], prev: Record<string, SegmentEntry[]> | null): Record<string, SegmentEntry[]> {
  const result: Record<string, SegmentEntry[]> = {};
  ARMS.forEach((arm, ai) => {
    const armDensity = densities[ai] ? densities[ai].pct : 50;
    result[arm.id] = SEGMENTS_DEF[arm.id].map((seg, si) => {
      const congestionFactor = si === 0 ? armDensity : si === 1 ? armDensity * 0.6 : armDensity * 0.3;
      const baseSpeed = si === 0 ? 15 : si === 1 ? 25 : 38;
      const prevSpeed = prev && prev[arm.id] ? prev[arm.id][si].speed : baseSpeed;
      const speed = Math.max(4, Math.min(55, prevSpeed + rand(-4, 4) - congestionFactor * 0.1));
      const flow = speed > 35 ? 'Free' : speed > 20 ? 'Moderate' : speed > 10 ? 'Slow' : 'Jammed';
      return { ...seg, speed: Math.round(speed), flow, armId: arm.id };
    });
  });
  return result;
}

// ─── Signal Engine ────────────────────────────────────────────────────────────
interface Signal { armId: string; greenTime: number }
interface SignalState { armId: string; phase: 'GREEN' | 'YELLOW' | 'RED'; timer: number; greenTime: number }

function computeSignals(densities: ArmDensity[], adaptiveMode: boolean): Signal[] {
  if (!adaptiveMode) return ARMS.map(arm => ({ armId: arm.id, greenTime: 30 }));
  const total = densities.reduce((s, d) => s + d.count, 0) || 1;
  return densities.map(d => ({ armId: d.id, greenTime: Math.max(10, Math.round((d.count / total) * 90)) }));
}

function initSignalStates(signals: Signal[]): SignalState[] {
  return signals.map((sig, i) => ({
    armId: sig.armId,
    phase: i === 0 ? 'GREEN' : 'RED',
    timer: i === 0 ? sig.greenTime : 5,
    greenTime: sig.greenTime,
  }));
}

// ─── Notification Builder ─────────────────────────────────────────────────────
interface AltRoute { name: string; via: string; avoid: string }
interface TravellerMsg { type: string; icon: string; msg: string; altRoute: AltRoute; exitTimeMins: number }

function computeExitTime(armId: string, segmentData: Record<string, SegmentEntry[]> | null) {
  const seg0 = segmentData?.[armId]?.[0];
  const speedKmh = seg0 ? seg0.speed : 15;
  return Math.max(1, Math.round((1 / speedKmh) * 60));
}

function buildTravellerMessage(arm: typeof ARMS[0], density: ArmDensity, dist: number, segmentData: Record<string, SegmentEntry[]> | null): TravellerMsg {
  const wait = Math.round(density.pct * 0.15 + dist * 0.5);
  const altRoute = ALT_ROUTES[arm.id]?.any ?? { name: 'Service Road', via: 'Use parallel service road', avoid: '' };
  const exitTimeMins = computeExitTime(arm.id, segmentData);
  if (density.pct >= 75) return { type: 'critical', icon: '🚨', msg: `Heavy congestion at Nagawara Junction (${arm.short} side). Estimated delay: ${wait} min.`, altRoute, exitTimeMins };
  if (density.pct >= 50) return { type: 'warning',  icon: '⚠️',  msg: `Moderate traffic near Nagawara Junction (${arm.short}). ~${wait} min wait. Signal timings adjusted.`, altRoute, exitTimeMins };
  return { type: 'info', icon: 'ℹ️', msg: `Traffic flowing normally at Nagawara Junction (${arm.short}). Estimated travel time: ${wait} min.`, altRoute, exitTimeMins };
}

function computeRoutes(armId: string, vehicleType: string, segmentData: Record<string, SegmentEntry[]>) {
  const opts = ROUTE_OPTIONS[armId]?.[vehicleType] ?? [];
  const segs = segmentData[armId] ?? [];
  const avgSpeed = segs.length ? segs.reduce((s, x) => s + x.speed, 0) / segs.length : 20;
  return opts.map(opt => ({ ...opt, eta: Math.round((opt.dist / (avgSpeed * opt.coeff)) * 60) }))
             .sort((a, b) => a.eta - b.eta);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JunctionMap({ densities, signalStates }: { densities: ArmDensity[]; signalStates: SignalState[] | null }) {
  const cx = 160, cy = 160, roadW = 36, jBox = 50;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <MapPin size={14} className="text-blue-400" />
          Junction Live Map
        </div>
        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-semibold">Nagawara, Bangalore</span>
      </div>
      <div className="flex justify-center">
        <svg width="320" height="320" viewBox="0 0 320 320">
          {/* Roads */}
          <rect x={cx - roadW/2} y={0} width={roadW} height={cy - jBox/2} fill="#334155"/>
          <line x1={cx} y1={0} x2={cx} y2={cy - jBox/2} stroke="#475569" strokeWidth={1} strokeDasharray="6,5"/>
          <rect x={cx - roadW/2} y={cy + jBox/2} width={roadW} height={320 - cy - jBox/2} fill="#334155"/>
          <line x1={cx} y1={cy+jBox/2} x2={cx} y2={320} stroke="#475569" strokeWidth={1} strokeDasharray="6,5"/>
          <rect x={0} y={cy - roadW/2} width={cx - jBox/2} height={roadW} fill="#334155"/>
          <line x1={0} y1={cy} x2={cx - jBox/2} y2={cy} stroke="#475569" strokeWidth={1} strokeDasharray="6,5"/>
          <rect x={cx + jBox/2} y={cy - roadW/2} width={320 - cx - jBox/2} height={roadW} fill="#334155"/>
          <line x1={cx + jBox/2} y1={cy} x2={320} y2={cy} stroke="#475569" strokeWidth={1} strokeDasharray="6,5"/>
          {/* Junction box */}
          <rect x={cx - jBox/2} y={cy - jBox/2} width={jBox} height={jBox} fill="#475569" rx={4}/>
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={600}>JUNCTION</text>
          {/* Density overlays */}
          {densities.map(arm => {
            const fillH = Math.round((arm.pct / 100) * 36);
            const col = densityColor(arm.pct);
            return (
              <g key={arm.id}>
                {arm.id === 'north' && <rect x={cx-roadW/2+2} y={cy-jBox/2-fillH-4} width={roadW-4} height={fillH} fill={col} opacity={0.35} rx={2}/>}
                {arm.id === 'south' && <rect x={cx-roadW/2+2} y={cy+jBox/2+4} width={roadW-4} height={fillH} fill={col} opacity={0.35} rx={2}/>}
                {arm.id === 'west'  && <rect x={cx-jBox/2-fillH-4} y={cy-roadW/2+2} width={fillH} height={roadW-4} fill={col} opacity={0.35} rx={2}/>}
                {arm.id === 'east'  && <rect x={cx+jBox/2+4} y={cy-roadW/2+2} width={fillH} height={roadW-4} fill={col} opacity={0.35} rx={2}/>}
              </g>
            );
          })}
          {/* Signal lights */}
          {signalStates && signalStates.map(sig => {
            const sigPos: Record<string, {x:number;y:number}> = {
              north: { x: cx - roadW/2 - 18, y: cy - jBox/2 - 30 },
              south: { x: cx - roadW/2 - 18, y: cy + jBox/2 + 10 },
              east:  { x: cx + jBox/2 + 10,  y: cy - roadW/2 - 18 },
              west:  { x: cx - jBox/2 - 30,  y: cy - roadW/2 - 18 },
            };
            const pos = sigPos[sig.armId];
            if (!pos) return null;
            return (
              <g key={sig.armId}>
                <rect x={pos.x} y={pos.y} width={12} height={28} rx={3} fill="#1a1a2e" stroke="#334155" strokeWidth={1}/>
                <circle cx={pos.x+6} cy={pos.y+6}  r={4} fill={sig.phase==='RED'    ? '#ef4444' : '#3f1f1f'}/>
                <circle cx={pos.x+6} cy={pos.y+14} r={4} fill={sig.phase==='YELLOW' ? '#fbbf24' : '#3f3010'}/>
                <circle cx={pos.x+6} cy={pos.y+22} r={4} fill={sig.phase==='GREEN'  ? '#22c55e' : '#0f2f1f'}/>
              </g>
            );
          })}
          {/* Arm labels */}
          <text x={cx} y={14}    textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={600}>↑ Hebbal / ORR</text>
          <text x={cx} y={312}   textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={600}>↓ RT Nagar</text>
          <text x={304} y={cy+4} textAnchor="end"    fontSize={11} fill="#94a3b8" fontWeight={600}>Kalyan Nagar →</text>
          <text x={16}  y={cy+4} textAnchor="start"  fontSize={11} fill="#94a3b8" fontWeight={600}>← Manyata</text>
          {/* Count bubbles */}
          {densities.map(arm => {
            const bubblePos: Record<string, {x:number;y:number}> = {
              north: { x: cx-16, y: cy-jBox/2-50 },
              south: { x: cx-16, y: cy+jBox/2+55 },
              east:  { x: cx+jBox/2+65, y: cy-20 },
              west:  { x: cx-jBox/2-80, y: cy-20 },
            };
            const bp = bubblePos[arm.id];
            const col = densityColor(arm.pct);
            return (
              <g key={arm.id}>
                <rect x={bp.x} y={bp.y} width={32} height={18} rx={4} fill={col} opacity={0.85}/>
                <text x={bp.x+16} y={bp.y+12} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{arm.count}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function DensityPanel({ densities }: { densities: ArmDensity[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mb-3">
        <Activity size={14} className="text-purple-400" />
        Vehicle Density per Arm
      </div>
      <div className="grid grid-cols-2 gap-2">
        {densities.map(arm => {
          const lbl = densityLabel(arm.pct);
          return (
            <div key={arm.id} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5">{arm.short}</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold" style={{color: arm.color}}>{arm.count}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lbl.cls}`}>{lbl.text}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">vehicles · {arm.pct}% capacity</div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width: arm.pct + '%', background: densityColor(arm.pct)}}/>
              </div>
            </div>
          );
        })}
      </div>
      {/* Mini bar chart */}
      <div className="mt-3">
        <div className="text-xs text-slate-500 mb-2">Vehicle Count (current)</div>
        <div className="flex items-end gap-1.5 h-16">
          {densities.map(arm => (
            <div key={arm.id} className="flex flex-col items-center gap-1 flex-1">
              <div className="text-xs text-slate-400">{arm.count}</div>
              <div className="w-full rounded-t transition-all duration-700 min-h-0.5"
                style={{ height: Math.round((arm.count / 120) * 48) + 'px', background: `linear-gradient(to top, ${arm.color}cc, ${arm.color}44)` }}/>
              <div className="text-xs text-slate-500">{arm.short.split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalPanel({ signalStates, adaptiveMode }: { signalStates: SignalState[] | null; adaptiveMode: boolean }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <span>🚦</span> Signal Control Panel
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${adaptiveMode ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'}`}>
          {adaptiveMode ? '🤖 Adaptive' : '🔧 Manual'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {signalStates && signalStates.map(sig => {
          const arm = ARMS.find(a => a.id === sig.armId);
          const phaseColor = sig.phase === 'GREEN' ? '#22c55e' : sig.phase === 'YELLOW' ? '#fbbf24' : '#ef4444';
          return (
            <div key={sig.armId} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5">
              <div className="text-xs text-slate-400 font-semibold uppercase mb-2">{arm?.short}</div>
              {/* Traffic light */}
              <div className="flex flex-col items-center gap-1 bg-slate-950 rounded-lg p-2 w-9 mx-auto mb-2 border border-slate-700">
                <div className="w-4 h-4 rounded-full border border-slate-900" style={{background: sig.phase==='RED'    ? '#ef4444' : '#3f1f1f', boxShadow: sig.phase==='RED' ? '0 0 8px #ef4444' : 'none'}}/>
                <div className="w-4 h-4 rounded-full border border-slate-900" style={{background: sig.phase==='YELLOW' ? '#fbbf24' : '#3f3010', boxShadow: sig.phase==='YELLOW' ? '0 0 8px #fbbf24' : 'none'}}/>
                <div className="w-4 h-4 rounded-full border border-slate-900" style={{background: sig.phase==='GREEN'  ? '#22c55e' : '#0f2f1f', boxShadow: sig.phase==='GREEN' ? '0 0 8px #22c55e' : 'none'}}/>
              </div>
              <div className="text-lg font-bold text-center text-slate-100 tabular-nums">{sig.timer}s</div>
              <div className="text-xs text-slate-500 text-center">remaining</div>
              <div className="text-xs font-bold text-center mt-1" style={{color: phaseColor}}>{sig.phase}</div>
              <div className="text-xs text-slate-600 text-center mt-1">Green: {sig.greenTime}s</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Notif { id: number; type: string; icon: string; msg: string; arm: string; time: Date; reachCount: number }

function NotificationsPanel({ notifications }: { notifications: Notif[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <AlertTriangle size={14} className="text-yellow-400" />
          Junction Alert Feed
        </div>
        <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">{notifications.length}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2">Dispatched to travellers within 5 km radius</div>
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-96 flex-1">
        {notifications.length === 0 && <div className="text-slate-600 text-xs text-center mt-5">Monitoring junction...</div>}
        {[...notifications].reverse().map(n => {
          const borderColor = n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#fbbf24' : n.type === 'clear' ? '#22c55e' : '#3b82f6';
          const typeColor   = n.type === 'critical' ? 'text-red-400' : n.type === 'warning' ? 'text-yellow-400' : n.type === 'clear' ? 'text-green-400' : 'text-blue-400';
          return (
            <div key={n.id} className="bg-slate-900 rounded-lg p-2.5 animate-fade-in" style={{borderLeft: `3px solid ${borderColor}`}}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold uppercase tracking-wide ${typeColor}`}>{n.icon} {n.type}</span>
                <span className="text-xs text-slate-500">{formatTime(n.time)}</span>
              </div>
              <div className="text-xs text-slate-300 leading-snug">{n.msg}</div>
              <div className="flex gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                <span>📍 {n.arm} Arm</span>
                <span>👥 {n.reachCount} notified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BroadcastEntry { id: number; travellerId: string; ts: number; type: string; icon: string; msg: string; altRoute?: AltRoute; exitTimeMins?: number }
interface Traveller { id: string; name: string; arm: string; dist: number; bearing: number; area: string; short: string }

function BroadcastLog({ broadcastLog, travellers }: { broadcastLog: BroadcastEntry[]; travellers: Traveller[] }) {
  const tMap = useMemo(() => Object.fromEntries(travellers.map(t => [t.id, t])), [travellers]);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Users size={14} className="text-purple-400" />
          Per-Traveller Broadcast Log
        </div>
        <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full font-semibold">{broadcastLog.length} sent</span>
      </div>
      <div className="text-xs text-slate-500 mb-2">Individual alerts delivered to travellers within 5 km</div>
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-80">
        {broadcastLog.length === 0 && <div className="text-slate-600 text-xs text-center mt-4">No alerts dispatched yet...</div>}
        {[...broadcastLog].reverse().map(b => {
          const t = tMap[b.travellerId];
          if (!t) return null;
          const col = AVATAR_COLORS[travellers.findIndex(tv => tv.id === t.id) % AVATAR_COLORS.length];
          const borderCol = b.type === 'critical' ? '#ef4444' : b.type === 'warning' ? '#fbbf24' : b.type === 'clear' ? '#22c55e' : '#3b82f6';
          return (
            <div key={b.id} className="bg-slate-900 rounded-lg p-2.5 flex gap-2.5" style={{borderLeft: `2px solid ${borderCol}`}}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background: col}}>
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-100">{t.name}</span>
                  <span className="text-xs text-slate-600">{formatTime(new Date(b.ts))}</span>
                </div>
                <div className="text-xs text-slate-500">📍 {t.area} · {t.dist.toFixed(1)} km · → {t.short}</div>
                <div className="text-xs text-slate-400 mt-0.5">{b.icon} {b.msg}</div>
                {b.altRoute && (
                  <div className="mt-1 bg-slate-950 border border-green-900 rounded p-1.5">
                    <div className="text-xs font-bold text-green-400 mb-0.5">🛣️ Alternate Route</div>
                    <div className="text-xs font-semibold text-slate-100">{b.altRoute.name}</div>
                    <div className="text-xs text-slate-400">via {b.altRoute.via}</div>
                    {b.altRoute.avoid && <div className="text-xs text-yellow-400 mt-0.5">⚠️ {b.altRoute.avoid}</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadiusMap({ travellers, broadcastLog }: { travellers: Traveller[]; densities?: ArmDensity[]; broadcastLog: BroadcastEntry[] }) {
  const SVG = 280, cx = 140, cy = 140, maxKm = 5, R = 110;
  const recentIds = useMemo(() => {
    const cutoff = Date.now() - 10000;
    return new Set(broadcastLog.filter(b => b.ts > cutoff).map(b => b.travellerId));
  }, [broadcastLog]);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <span className="text-purple-400">◎</span> 5 km Traveller Alert Zone
        </div>
        <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full font-semibold">{travellers.length} travellers</span>
      </div>
      <div className="flex justify-center">
        <svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <circle cx={cx} cy={cy} r={R+10} fill="#0f172a"/>
          {[1,2,3,4,5].map(km => <circle key={km} cx={cx} cy={cy} r={(km/maxKm)*R} fill="none" stroke="#1e293b" strokeWidth={1} strokeDasharray="3,3"/>)}
          {[1,2,3,4,5].map(km => <text key={km} x={cx + (km/maxKm)*R + 2} y={cy - 2} fontSize={8} fill="#334155">{km}km</text>)}
          {ARMS.map(arm => {
            const rad = ((arm.angle - 90) * Math.PI) / 180;
            return <line key={arm.id} x1={cx} y1={cy} x2={cx + (R+10)*Math.cos(rad)} y2={cy + (R+10)*Math.sin(rad)} stroke={arm.color} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>;
          })}
          {ARMS.map(arm => {
            const rad = ((arm.angle - 90) * Math.PI) / 180;
            const lx = cx + (R+8)*Math.cos(rad);
            const ly = cy + (R+8)*Math.sin(rad);
            const anchor = arm.angle === 0 ? 'start' : arm.angle === 180 ? 'end' : 'middle';
            return <text key={arm.id} x={lx} y={ly + (arm.angle===90?8: arm.angle===270?-2:4)} textAnchor={anchor} fontSize={8} fill={arm.color} fontWeight={600}>{arm.short}</text>;
          })}
          {travellers.map((t, i) => {
            const pos = polarToSVG(t.bearing, t.dist, cx, cy, maxKm, R);
            const isNotified = recentIds.has(t.id);
            const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <g key={t.id}>
                {isNotified && <circle cx={pos.x} cy={pos.y} r={10} fill={col} opacity={0.15}/>}
                <circle cx={pos.x} cy={pos.y} r={5} fill={col} opacity={isNotified ? 1 : 0.6} stroke={isNotified ? '#fff' : 'none'} strokeWidth={1}/>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={7} fill="#2563eb" stroke="#93c5fd" strokeWidth={1.5}/>
          <text x={cx} y={cy+3} textAnchor="middle" fontSize={6} fill="#fff" fontWeight={700}>J</text>
        </svg>
      </div>
    </div>
  );
}

function GpsSensorPanel({ gpsData }: { gpsData: GpsSensor[] | null }) {
  if (!gpsData) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <span className="text-green-400">●</span> Live GPS Sensors — Junction Entrances
        </div>
        <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full font-semibold">4 sensors · live</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {gpsData.map(s => {
          const arm = ARMS.find(a => a.id === s.armId);
          return (
            <div key={s.armId} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5" style={{borderLeft: `2px solid ${arm?.color ?? '#334155'}`}}>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-bold" style={{color: arm?.color}}>{s.name}</span>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full" style={{background: s.locked ? '#22c55e' : '#ef4444', boxShadow: s.locked ? '0 0 4px #22c55e' : 'none'}}/>
                  <span style={{color: s.locked ? '#22c55e' : '#ef4444'}}>{s.locked ? `LOCK · ${s.satellites} sat` : 'SEARCHING'}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-1.5">📍 {s.lat}°N, {s.lng}°E · ±{s.accuracy}m</div>
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 rounded px-2 py-1">
                  <div className="text-sm font-bold" style={{color: s.speed < 15 ? '#ef4444' : s.speed < 30 ? '#fbbf24' : '#22c55e'}}>{s.speed}</div>
                  <div className="text-xs text-slate-500">km/h</div>
                </div>
                <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-semibold">{s.headingLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SegmentSpeedMap({ segmentData }: { segmentData: Record<string, SegmentEntry[]> | null }) {
  if (!segmentData) return null;
  const speedColor = (spd: number) => spd > 35 ? '#22c55e' : spd > 20 ? '#fbbf24' : spd > 10 ? '#f97316' : '#ef4444';
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <span className="text-yellow-400">⟶</span> Road Segment Speed — Leading to Junction
        </div>
        <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">per arm · 3 segments</span>
      </div>
      {ARMS.map(arm => {
        const segs = segmentData[arm.id] ?? [];
        return (
          <div key={arm.id} className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold" style={{color: arm.color}}>↗ {arm.short}</span>
              <span className="text-xs text-slate-600">← junction direction</span>
            </div>
            <div className="flex gap-1">
              {segs.map((seg, si) => (
                <div key={si} className="flex-1 rounded-lg p-1.5 border text-center" style={{background: speedColor(seg.speed) + '18', borderColor: speedColor(seg.speed) + '55'}}>
                  <div className="text-xs text-slate-500">{seg.label}</div>
                  <div className="text-xs text-slate-600 mb-0.5">{seg.desc}</div>
                  <div className="text-sm font-bold" style={{color: speedColor(seg.speed)}}>{seg.speed} <span className="text-xs font-normal text-slate-500">km/h</span></div>
                  <div className="text-xs" style={{color: speedColor(seg.speed)}}>{seg.flow}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RouteAdvisor({ segmentData, selectedArm, onSelectArm }: { segmentData: Record<string, SegmentEntry[]> | null; selectedArm: string; onSelectArm: (id: string) => void }) {
  const [vehicleType, setVehicleType] = useState('2w');
  const routes = useMemo(() => {
    if (!segmentData || !selectedArm) return [];
    return computeRoutes(selectedArm, vehicleType, segmentData);
  }, [segmentData, selectedArm, vehicleType]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <CheckCircle size={14} className="text-green-400" />
          Fastest Route Advisor
        </div>
        <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full font-semibold">AI · real-time</span>
      </div>
      {/* Arm selector */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {ARMS.map(arm => (
          <button key={arm.id} onClick={() => onSelectArm(arm.id)}
            className="px-2.5 py-1 rounded-md text-xs font-semibold border transition-all"
            style={{
              borderColor: selectedArm === arm.id ? arm.color : '#334155',
              background: selectedArm === arm.id ? arm.color + '22' : '#0f172a',
              color: selectedArm === arm.id ? arm.color : '#64748b',
            }}>
            {arm.short}
          </button>
        ))}
      </div>
      {/* Vehicle type tabs */}
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => setVehicleType('2w')}
          className={`flex-1 py-1.5 rounded-md border text-xs font-semibold transition-all ${vehicleType === '2w' ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
          🏍️ Two-Wheeler
        </button>
        <button onClick={() => setVehicleType('4w')}
          className={`flex-1 py-1.5 rounded-md border text-xs font-semibold transition-all ${vehicleType === '4w' ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
          🚗 Four-Wheeler
        </button>
      </div>
      {/* Route cards */}
      {routes.map((r, i) => (
        <div key={i} className={`bg-slate-900 rounded-lg p-2.5 mb-2 border ${i === 0 ? 'border-green-700' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-green-900 text-green-400' : i === 1 ? 'bg-blue-900 text-blue-400' : 'bg-purple-900 text-purple-400'}`}>
              {i === 0 ? '🥇 Fastest' : i === 1 ? '🥈 Alt 1' : '🥉 Alt 2'}
            </span>
            <span className={`text-xs font-semibold ${i === 0 ? 'text-green-400' : 'text-slate-500'}`}>{r.eta} min</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{r.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">via {r.via}</div>
          <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
            <span>📏 <strong className="text-slate-200">{r.dist} km</strong></span>
            <span>⏱ <strong className="text-slate-200">{r.eta} min ETA</strong></span>
          </div>
          <div className={`text-xs mt-1 ${vehicleType === '2w' ? 'text-yellow-400' : 'text-blue-400'}`}>
            {vehicleType === '2w' ? '🏍️' : '🚗'} {r.note}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NammaFix Complaint Feed ──────────────────────────────────────────────────
interface NfComplaint {
  id: string; title: string; description: string; type: string; severity: string;
  status: string; wardId?: number; wardName?: string; ward?: string; arm?: string;
  upvotes: number; escalationLevel: number; hoursElapsed: number; slaHours: number;
  aiClassification?: string; filedAt: string; trafficImpact?: string;
}

function NfComplaintFeed({ complaints, votes, onVote, densities }: {
  complaints: NfComplaint[]; votes: Record<string, boolean>; onVote: (id: string) => void; densities: ArmDensity[];
}) {
  const [tab, setTab] = useState('all');
  const tabs = [
    { key: 'all',      label: 'All',      count: complaints.length },
    { key: 'critical', label: 'Critical', count: complaints.filter(c => c.severity === 'critical').length },
    { key: 'escalated',label: 'Escalated',count: complaints.filter(c => c.status === 'escalated').length },
    { key: 'sla',      label: 'SLA Breach',count: complaints.filter(c => c.hoursElapsed > c.slaHours && c.status !== 'resolved').length },
  ];
  const filtered = tab === 'all' ? complaints
    : tab === 'critical' ? complaints.filter(c => c.severity === 'critical')
    : tab === 'escalated' ? complaints.filter(c => c.status === 'escalated')
    : complaints.filter(c => c.hoursElapsed > c.slaHours && c.status !== 'resolved');

  const sevBorder: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#fbbf24', low: '#22c55e' };
  const sevBadge: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-400 border-red-900',
    high: 'bg-orange-900/50 text-orange-400 border-orange-900',
    medium: 'bg-yellow-900/50 text-yellow-400 border-yellow-900',
    low: 'bg-green-900/50 text-green-400 border-green-900',
  };
  const statBadge: Record<string, string> = {
    open: 'bg-red-900/50 text-red-400 border-red-900',
    assigned: 'bg-orange-900/50 text-orange-400 border-orange-900',
    in_progress: 'bg-blue-900/50 text-blue-400 border-blue-900',
    resolved: 'bg-green-900/50 text-green-400 border-green-900',
    escalated: 'bg-red-900/50 text-red-400 border-red-900',
  };
  const statLabel: Record<string, string> = { open: 'Open', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', escalated: 'Escalated ⬆️' };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <span className="text-orange-400">≡</span> Civic Issue Feed — Junction Area
        </div>
        <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">{complaints.length} reports</span>
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${tab === t.key ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            {t.label} <span className="opacity-70">({t.count})</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
        {filtered.map(c => {
          const armColor = NF_ARM_COLORS[c.arm ?? ''] ?? '#64748b';
          const armDensity = densities.find(d => d.id === c.arm);
          const voted = votes[c.id];
          const slaBreach = c.hoursElapsed > c.slaHours;
          const wardLabel = c.ward ?? c.wardName ?? '';
          return (
            <div key={c.id} className="bg-slate-900 rounded-xl p-3 flex gap-2.5 border-l-4 cursor-pointer hover:bg-slate-800 transition-colors"
              style={{borderLeftColor: sevBorder[c.severity] ?? '#64748b'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background: armColor + '22', border: `1px solid ${armColor}44`}}>
                {NF_ISSUE_ICONS[c.type] ?? '❓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-100">{c.title}</div>
                <div className="flex gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span>📍 {wardLabel}</span>
                  {c.arm && <span style={{color: armColor}}>→ {NF_ARM_LABELS[c.arm]}</span>}
                  <span>⏰ {c.hoursElapsed}h ago</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-snug">{c.description}</div>
                {c.trafficImpact && (
                  <div className="mt-1.5 bg-blue-900/20 border border-blue-900/50 rounded px-2 py-1 text-xs text-blue-300">
                    🚦 {c.trafficImpact}
                    {armDensity && <span className={`ml-1.5 ${armDensity.pct > 70 ? 'text-red-400' : 'text-yellow-400'}`}>· {armDensity.pct}% now</span>}
                  </div>
                )}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${sevBadge[c.severity] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>{c.severity}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${statBadge[c.status] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>{statLabel[c.status] ?? c.status}</span>
                  {slaBreach && <span className="text-xs px-1.5 py-0.5 rounded border font-semibold bg-red-900/50 text-red-400 border-red-900">⏳ +{c.hoursElapsed - c.slaHours}h breach</span>}
                  {c.escalationLevel >= 3 && <span className="text-xs px-1.5 py-0.5 rounded border font-semibold bg-orange-900/50 text-orange-400 border-orange-900">L{c.escalationLevel} Escalation</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">{c.aiClassification}</div>
                <button onClick={() => onVote(c.id)}
                  className={`mt-1.5 text-xs flex items-center gap-1 px-2 py-1 rounded border transition-all ${voted ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-slate-700 text-slate-500 bg-slate-800 hover:border-orange-500 hover:text-orange-400'}`}>
                  👍 {c.upvotes + (voted ? 1 : 0)} {voted ? '· Upvoted' : 'Upvote'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NfWardScoreboard({ densities }: { densities: ArmDensity[] }) {
  const sorted = [...NF_WARDS].sort((a, b) => a.resolveRate - b.resolveRate);
  const worstWard = sorted[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          ⭐ Ward Accountability — Junction Arms
        </div>
        <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">NammaFix</span>
      </div>
      {worstWard && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-2.5 mb-3 text-xs text-red-300">
          🚨 <strong className="text-red-200">Worst: {worstWard.wardName} (Ward {worstWard.ward})</strong> — only {worstWard.resolveRate}% resolved · {worstWard.pendingOver7} pending &gt;7d · Corp: {worstWard.corpName} ({worstWard.party})
        </div>
      )}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
        {sorted.map(w => {
          const rateColor = w.resolveRate >= 80 ? '#22c55e' : w.resolveRate >= 60 ? '#fbbf24' : '#ef4444';
          const armColor = NF_ARM_COLORS[w.arm] ?? '#64748b';
          const armDensity = densities.find(d => d.id === w.arm);
          return (
            <div key={w.ward} className="bg-slate-900 rounded-lg p-2.5 border-l-2" style={{borderLeftColor: armColor}}>
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <div className="text-xs font-bold text-slate-100">{w.wardName} (Ward {w.ward})</div>
                  <div className="text-xs text-slate-500">{w.corpName} · {w.party}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold" style={{color: rateColor}}>{w.resolveRate}%</div>
                  <div className="text-xs text-slate-500">resolved</div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{width: w.resolveRate + '%', background: rateColor}}/>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>📋 <strong className="text-slate-400">{w.total}</strong> total</span>
                <span>⏳ <strong className="text-slate-400">{w.pendingOver7}</strong> &gt;7d</span>
                <span>⭐ <strong className="text-slate-400">{w.rating}</strong>/5</span>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-xs">
                <span>🚦</span>
                <span style={{color: armColor}}>Feeds → {NF_ARM_LABELS[w.arm]}</span>
                {armDensity && <span className={`ml-1 ${armDensity.pct > 70 ? 'text-red-400' : armDensity.pct > 40 ? 'text-yellow-400' : 'text-green-400'}`}>· {armDensity.pct}%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast extends Notif { altRoute?: AltRoute; exitTimeMins?: number }

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => {
        const borderCol = t.type === 'critical' ? '#ef4444' : t.type === 'warning' ? '#fbbf24' : t.type === 'clear' ? '#22c55e' : '#3b82f6';
        return (
          <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 min-w-72 max-w-sm shadow-2xl pointer-events-auto flex gap-2.5 items-start"
            style={{borderLeft: `3px solid ${borderCol}`}}>
            <div className="text-xl flex-shrink-0">{t.icon}</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-100 mb-0.5">
                {t.type === 'critical' ? '🚨 Traffic Alert — Nagawara Junction' : t.type === 'warning' ? '⚠️ Congestion Warning' : t.type === 'clear' ? '✅ Traffic Cleared' : 'ℹ️ Junction Update'}
              </div>
              <div className="text-xs text-slate-400 leading-snug">{t.msg}</div>
              <div className="text-xs text-purple-400 mt-1 font-semibold">📡 Notified {t.reachCount} travellers</div>
              {t.exitTimeMins !== undefined && <div className="text-xs text-blue-400 mt-0.5">🚦 Exit zone in ~{t.exitTimeMins} min</div>}
            </div>
            <button onClick={() => onClose(t.id)} className="text-slate-500 hover:text-slate-200 text-lg leading-none flex-shrink-0">×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrafficPage() {
  const [junction, setJunction] = useState('nagawara');
  const [showJunctionDropdown, setShowJunctionDropdown] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [time, setTime] = useState(new Date());
  const [densities, setDensities] = useState<ArmDensity[]>(() => generateSensorData(null));
  const [signalStates, setSignalStates] = useState<SignalState[] | null>(null);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [broadcastLog, setBroadcastLog] = useState<BroadcastEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gpsData, setGpsData] = useState<GpsSensor[]>(() => generateGpsReadings(null));
  const [segmentData, setSegmentData] = useState<Record<string, SegmentEntry[]> | null>(null);
  const [selectedArm, setSelectedArm] = useState('north');
  const [nfVotes, setNfVotes] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const signalRef = useRef<Signal[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentDataRef = useRef<Record<string, SegmentEntry[]> | null>(null);

  // Travellers — stable
  const travellers = useMemo<Traveller[]>(() => TRAVELLER_SEEDS.map((t, i) => ({
    ...t, id: 'T' + i, short: ARMS.find(a => a.id === t.arm)?.short ?? t.arm,
  })), []);

  // NammaFix complaints — from real data filtered for wards 6 & 85, plus static seed from dashboard
  const junctionConfig = JUNCTIONS.find(j => j.id === junction)!;
  const nfComplaints = useMemo<NfComplaint[]>(() => {
    const fromData = COMPLAINTS
      .filter(c => junctionConfig.wards.includes(c.wardId))
      .map(c => ({
        id: c.id, title: c.title, description: c.description, type: c.type,
        severity: c.severity, status: c.status, wardId: c.wardId,
        wardName: c.wardName, arm: c.wardId === 6 ? 'north' : 'east',
        upvotes: c.upvotes, escalationLevel: c.escalationLevel,
        hoursElapsed: c.hoursElapsed, slaHours: c.slaHours,
        aiClassification: c.aiClassification, filedAt: c.filedAt,
        trafficImpact: c.wardId === 6
          ? 'Issue in Hebbal ward → impacts North arm vehicle flow'
          : 'Issue near Kalyan Nagar → impacts East arm throughput',
      }));
    return fromData;
  }, [junctionConfig]);

  const corporatorForWard6 = CORPORATORS.find(c => c.ward === 6);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sensor + segment update every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setDensities(prev => {
        const next = generateSensorData(prev);
        setSegmentData(prevSeg => {
          const nextSeg = generateSegmentData(next, prevSeg);
          segmentDataRef.current = nextSeg;
          return nextSeg;
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // GPS update every 2s
  useEffect(() => {
    const id = setInterval(() => setGpsData(prev => generateGpsReadings(prev)), 2000);
    return () => clearInterval(id);
  }, []);

  // Init segment data
  useEffect(() => {
    const initSeg = generateSegmentData(densities, null);
    setSegmentData(initSeg);
    segmentDataRef.current = initSeg;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Signal recompute on density / mode change
  useEffect(() => {
    const signals = computeSignals(densities, adaptiveMode);
    if (!signalStates) {
      setSignalStates(initSignalStates(signals));
      signalRef.current = signals;
    } else {
      signalRef.current = signals;
      setSignalStates(prev => prev!.map((s, i) => ({ ...s, greenTime: signals[i]?.greenTime ?? s.greenTime })));
    }
  }, [densities, adaptiveMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signal phase ticker — 1s
  useEffect(() => {
    const id = setInterval(() => {
      setSignalStates(prev => {
        if (!prev) return prev;
        return prev.map((sig, i) => {
          if (sig.timer > 1) return { ...sig, timer: sig.timer - 1 };
          if (sig.phase === 'GREEN')  return { ...sig, phase: 'YELLOW', timer: 3 };
          if (sig.phase === 'YELLOW') return { ...sig, phase: 'RED',    timer: 30 };
          const activeIdx = prev.findIndex(s => s.phase === 'GREEN' || s.phase === 'YELLOW');
          const nextIdx = (i + 1) % prev.length;
          if (nextIdx === (activeIdx === -1 ? 0 : (activeIdx + 1) % prev.length)) {
            const signals = signalRef.current;
            return { ...sig, phase: 'GREEN', timer: signals ? signals[nextIdx]?.greenTime ?? 30 : 30 };
          }
          return sig;
        });
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Notification + broadcast engine
  useEffect(() => {
    function scheduleNext() {
      const delay = rand(7000, 13000);
      timerRef.current = setTimeout(() => {
        setDensities(currentDensities => {
          const heavyArms = currentDensities.filter(d => d.pct > 60);
          const targetDensity = heavyArms.length > 0
            ? heavyArms[rand(0, heavyArms.length - 1)]
            : currentDensities[rand(0, 3)];
          const arm = ARMS.find(a => a.id === targetDensity.id)!;
          const currentSeg = segmentDataRef.current;
          const { type, icon, msg, altRoute, exitTimeMins } = buildTravellerMessage(arm, targetDensity, 0, currentSeg);
          const affected = travellers.filter(t => t.arm === arm.id);
          const reachCount = affected.length;
          const junctionNotif: Notif = { id: Date.now() + Math.random(), type, icon, msg, arm: arm.short, time: new Date(), reachCount };
          setNotifications(n => [...n.slice(-24), junctionNotif]);
          const ts = Date.now();
          const newBroadcasts: BroadcastEntry[] = affected.map((t, bi) => {
            const perTraveller = buildTravellerMessage(arm, targetDensity, t.dist, currentSeg);
            return { id: ts + bi + Math.random(), travellerId: t.id, ts: ts + bi * 50, type: perTraveller.type, icon: perTraveller.icon, msg: perTraveller.msg, altRoute: perTraveller.altRoute, exitTimeMins: perTraveller.exitTimeMins };
          });
          setBroadcastLog(prev => [...prev.slice(-99), ...newBroadcasts]);
          if (type === 'critical' || type === 'warning') {
            const toast: Toast = { ...junctionNotif, altRoute, exitTimeMins, id: ts + 9999 };
            setToasts(t => [...t.slice(-2), toast]);
            setTimeout(() => setToasts(tt => tt.filter(x => x.id !== toast.id)), 7000);
          }
          return currentDensities;
        });
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [travellers]);

  const closeToast = (id: number) => setToasts(t => t.filter(x => x.id !== id));
  const totalBroadcast = broadcastLog.length;
  const totalVehicles = densities.reduce((s, d) => s + d.count, 0);
  const avgDensity = Math.round(densities.reduce((s, d) => s + d.pct, 0) / 4);
  const heavyCount = densities.filter(d => d.pct > 70).length;
  const maxArm = densities.reduce((a, b) => a.count > b.count ? a : b, densities[0]);

  const showComingSoon = () => {
    setToastMsg('Coming soon');
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Gauge size={16} className="text-blue-100" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Traffic Control</h1>
            <p className="text-xs text-slate-500">Real-time junction management · Bangalore</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Junction selector */}
          <div className="relative">
            <button
              onClick={() => setShowJunctionDropdown(d => !d)}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500 transition-colors min-w-44"
            >
              <MapPin size={12} className="text-blue-400 flex-shrink-0" />
              <span className="flex-1 text-left">{JUNCTIONS.find(j => j.id === junction)?.name ?? junction}</span>
              <ChevronDown size={12} className="text-slate-500" />
            </button>
            {showJunctionDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-30 min-w-full">
                {JUNCTIONS.map(j => (
                  <button key={j.id} onClick={() => { setJunction(j.id); setShowJunctionDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${junction === j.id ? 'text-blue-400' : 'text-slate-300'}`}>
                    {j.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Junction */}
          <button onClick={showComingSoon}
            className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
            <Plus size={12} /> Add Junction
          </button>

          {/* Adaptive mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Adaptive</span>
            <button onClick={() => setAdaptiveMode(m => !m)}
              className={`w-9 h-5 rounded-full relative transition-colors ${adaptiveMode ? 'bg-blue-600' : 'bg-slate-700'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${adaptiveMode ? 'left-4' : 'left-0.5'}`}/>
            </button>
            <span className={`text-xs font-semibold ${adaptiveMode ? 'text-blue-400' : 'text-slate-500'}`}>{adaptiveMode ? 'ON' : 'OFF'}</span>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            LIVE
          </div>
          <div className="text-xs text-slate-400 tabular-nums">{formatTime(time)}</div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 px-5 pt-4 pb-3">
        {[
          { val: totalVehicles.toString(), label: 'Vehicles at Junction', color: '#60a5fa' },
          { val: avgDensity + '%', label: 'Avg Junction Density', color: avgDensity > 70 ? '#f87171' : avgDensity > 40 ? '#fbbf24' : '#22c55e' },
          { val: heavyCount.toString(), label: 'Arms in High Congestion', color: heavyCount > 1 ? '#f87171' : '#22c55e' },
          { val: maxArm?.short ?? '—', label: 'Most Congested Arm', color: '#a78bfa', small: true },
          { val: totalBroadcast.toString(), label: 'Traveller Alerts Sent', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className={`font-bold ${s.small ? 'text-base' : 'text-2xl'}`} style={{color: s.color}}>{s.val}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main 3-col grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr_320px] gap-3 px-5 pb-3">
        <JunctionMap densities={densities} signalStates={signalStates} />
        <DensityPanel densities={densities} />
        <NotificationsPanel notifications={notifications} />
      </div>

      {/* ── Signal Panel (full 2-col) ─────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr_320px] gap-3 px-5 pb-3">
        <div className="col-span-2">
          <SignalPanel signalStates={signalStates} adaptiveMode={adaptiveMode} />
        </div>
        {/* Radius map fills the right */}
        <RadiusMap travellers={travellers} densities={densities} broadcastLog={broadcastLog} />
      </div>

      {/* ── Broadcast Log ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <BroadcastLog broadcastLog={broadcastLog} travellers={travellers} />
      </div>

      {/* ── GPS + Segment Speed ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-3">
        <GpsSensorPanel gpsData={gpsData} />
        <SegmentSpeedMap segmentData={segmentData} />
      </div>

      {/* ── Route Advisor ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <RouteAdvisor segmentData={segmentData} selectedArm={selectedArm} onSelectArm={setSelectedArm} />
      </div>

      {/* ── NammaFix Civic Section ─────────────────────────────────────────── */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-slate-100 font-bold text-base">
              <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              NammaFix — Citizen Civic Reporting
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Road issues filed by citizens in wards surrounding Nagawara Junction · linked to live traffic density per arm
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {densities.map(d => (
              <div key={d.id} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{borderColor: NF_ARM_COLORS[d.id] + '44'}}>
                <span style={{color: NF_ARM_COLORS[d.id]}}>{d.short}</span>
                <span className={`ml-1.5 ${d.pct > 70 ? 'text-red-400' : d.pct > 40 ? 'text-yellow-400' : 'text-green-400'}`}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_340px] gap-3">
          <NfComplaintFeed complaints={nfComplaints} votes={nfVotes} onVote={id => setNfVotes(v => ({ ...v, [id]: !v[id] }))} densities={densities} />
          <NfWardScoreboard densities={densities} />

          {/* Ward 6 Corporator accountability card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <Users size={14} className="text-blue-400" /> Ward Corporator
              </div>
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-semibold">Ward 6 · Hebbal</span>
            </div>
            {corporatorForWard6 ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={corporatorForWard6.photo} alt={corporatorForWard6.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"/>
                  <div>
                    <div className="text-sm font-bold text-slate-100">{corporatorForWard6.name}</div>
                    <div className="text-xs text-slate-500">{corporatorForWard6.wardName} · {corporatorForWard6.party}</div>
                    <div className="text-xs text-slate-500">Since {corporatorForWard6.since}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { val: corporatorForWard6.resolvedOnTime, label: 'Resolved on time', color: '#22c55e' },
                    { val: corporatorForWard6.totalComplaints, label: 'Total complaints', color: '#60a5fa' },
                    { val: corporatorForWard6.pendingOver7Days, label: 'Pending >7 days', color: '#fbbf24' },
                    { val: corporatorForWard6.rating + '/5', label: 'Rating', color: '#a78bfa' },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold" style={{color: m.color}}>{m.val}</div>
                      <div className="text-xs text-slate-500">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900 rounded-lg p-2.5 mb-2">
                  <div className="text-xs text-slate-400 mb-1">Resolution Rate</div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{width: Math.round((corporatorForWard6.resolvedOnTime / corporatorForWard6.totalComplaints) * 100) + '%'}}/>
                  </div>
                  <div className="text-xs text-green-400 mt-1 font-semibold">{Math.round((corporatorForWard6.resolvedOnTime / corporatorForWard6.totalComplaints) * 100)}% on-time resolution</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2.5">
                  <div className="text-xs text-slate-400 mb-1.5">Contact</div>
                  <div className="text-xs text-slate-300">{corporatorForWard6.phone}</div>
                  <div className="text-xs text-blue-400 mt-0.5">{corporatorForWard6.email}</div>
                </div>
                <div className="mt-3 bg-blue-900/20 border border-blue-900/40 rounded-lg p-2.5 text-xs text-blue-300">
                  🚦 Hebbal (Ward 6) feeds the <strong className="text-blue-200">North Arm</strong> of Nagawara Junction. Civic issues here directly impact junction density.
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Corporator data not available</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toasts ────────────────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onClose={closeToast} />

      {/* Coming Soon mini toast */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-200 shadow-2xl z-50">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
