import { useState, useEffect, useRef, useCallback } from 'react';
import { Gauge, MapPin, AlertTriangle, Activity, Plus, ChevronDown, Clock, Zap } from 'lucide-react';
import { COMPLAINTS } from '../data';
import type { Complaint } from '../types';

// ── Junction config ───────────────────────────────────────────────────────────
const JUNCTIONS = [
  { id: 'nagawara', name: 'Nagawara Junction', lat: 13.0453, lng: 77.5967, wards: [6, 85] },
];

const ARMS = [
  { id: 'north', label: 'North · Hebbal',       short: 'N',  color: '#3b82f6', warn: '#93c5fd' },
  { id: 'south', label: 'South · RT Nagar',     short: 'S',  color: '#a855f7', warn: '#d8b4fe' },
  { id: 'east',  label: 'East · Kalyan Nagar',  short: 'E',  color: '#f59e0b', warn: '#fcd34d' },
  { id: 'west',  label: 'West · Manyata',       short: 'W',  color: '#22c55e', warn: '#86efac' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function densityClass(pct: number) {
  if (pct < 40) return { bar: '#22c55e', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400', label: 'Low' };
  if (pct < 70) return { bar: '#f59e0b', text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-400',   label: 'Medium' };
  return             { bar: '#ef4444', text: 'text-red-400',     badge: 'bg-red-500/15 text-red-400',       label: 'High' };
}

interface ArmState { id: string; label: string; short: string; color: string; warn: string; count: number; pct: number }
interface SignalState { armId: string; phase: 'GREEN' | 'YELLOW' | 'RED'; timer: number }
interface Alert { id: number; arm: string; msg: string; level: 'critical' | 'warning' | 'info'; time: string }

interface NfComplaint {
  id: string; title: string; type: string; severity: string; status: string;
  wardId?: number; upvotes: number; escalationLevel: number;
  hoursElapsed: number; slaHours: number; aiClassification?: string; filedAt: string;
}

function timeNow() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

// ── Sub-components ────────────────────────────────────────────────────────────
function JunctionSVG({ arms }: { arms: ArmState[] }) {
  const getArm = (id: string) => arms.find(a => a.id === id)!;
  const n = getArm('north'); const s = getArm('south');
  const e = getArm('east');  const w = getArm('west');
  const dc = (a: ArmState) => densityClass(a.pct);
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {/* Road arms */}
      <rect x="120" y="0"   width="60" height="110" fill="#1e293b" rx="4"/>
      <rect x="120" y="190" width="60" height="110" fill="#1e293b" rx="4"/>
      <rect x="0"   y="120" width="110" height="60" fill="#1e293b" rx="4"/>
      <rect x="190" y="120" width="110" height="60" fill="#1e293b" rx="4"/>
      {/* Center box */}
      <rect x="110" y="110" width="80" height="80" fill="#334155" rx="6"/>
      <text x="150" y="155" textAnchor="middle" className="text-[10px]" fill="#94a3b8" fontSize="10" fontWeight="600">NAGAWARA</text>
      {/* Density fills */}
      <rect x="120" y="0"   width="60" height={110 * n.pct / 100} fill={dc(n).bar} opacity="0.3" rx="4"/>
      <rect x="120" y={300 - 110 * s.pct / 100} width="60" height={110 * s.pct / 100} fill={dc(s).bar} opacity="0.3" rx="4"/>
      <rect x="0"   y="120" width={110 * w.pct / 100} height="60" fill={dc(w).bar} opacity="0.3" rx="4"/>
      <rect x={300 - 110 * e.pct / 100} y="120" width={110 * e.pct / 100} height="60" fill={dc(e).bar} opacity="0.3" rx="4"/>
      {/* Lane dividers */}
      <line x1="150" y1="10"  x2="150" y2="108"  stroke="#475569" strokeWidth="1" strokeDasharray="6,5"/>
      <line x1="150" y1="192" x2="150" y2="290"  stroke="#475569" strokeWidth="1" strokeDasharray="6,5"/>
      <line x1="10"  y1="150" x2="108" y2="150"  stroke="#475569" strokeWidth="1" strokeDasharray="6,5"/>
      <line x1="192" y1="150" x2="290" y2="150"  stroke="#475569" strokeWidth="1" strokeDasharray="6,5"/>
      {/* Count bubbles */}
      {[
        { x: 150, y: 55,  arm: n },
        { x: 150, y: 245, arm: s },
        { x: 55,  y: 150, arm: w },
        { x: 245, y: 150, arm: e },
      ].map(({ x, y, arm: a }) => (
        <g key={a.id}>
          <circle cx={x} cy={y} r="20" fill={a.color} opacity="0.2"/>
          <circle cx={x} cy={y} r="20" fill="none" stroke={a.color} strokeWidth="1.5" opacity="0.6"/>
          <text x={x} y={y - 3} textAnchor="middle" fill={a.warn} fontSize="11" fontWeight="700">{a.count}</text>
          <text x={x} y={y + 9} textAnchor="middle" fill={a.warn} fontSize="8" opacity="0.7">veh</text>
        </g>
      ))}
      {/* Arm labels */}
      <text x="150" y="14"  textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">HEBBAL</text>
      <text x="150" y="296" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">RT NAGAR</text>
      <text x="8"   y="153" fill="#64748b" fontSize="8" fontWeight="600">MANYATA</text>
      <text x="210" y="153" fill="#64748b" fontSize="8" fontWeight="600">KALYAN NGR</text>
    </svg>
  );
}

function SignalLight({ phase }: { phase: 'GREEN' | 'YELLOW' | 'RED' }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-[#060910] rounded-lg p-2 border border-white/[0.06] w-9">
      {(['RED','YELLOW','GREEN'] as const).map(c => (
        <div key={c} className="w-4 h-4 rounded-full border border-black/50 transition-all duration-300"
          style={{
            background: phase === c
              ? c === 'RED' ? '#ef4444' : c === 'YELLOW' ? '#fbbf24' : '#22c55e'
              : c === 'RED' ? '#3f1515' : c === 'YELLOW' ? '#3f3010' : '#0f2f1f',
            boxShadow: phase === c
              ? c === 'RED' ? '0 0 10px #ef4444' : c === 'YELLOW' ? '0 0 10px #fbbf24' : '0 0 10px #22c55e'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function TrafficPage() {
  const [junctionId, setJunctionId] = useState('nagawara');
  const [showJunctionDrop, setShowJunctionDrop] = useState(false);
  const [adaptive, setAdaptive] = useState(true);
  const [clock, setClock] = useState(timeNow);

  const [arms, setArms] = useState<ArmState[]>(() =>
    ARMS.map(a => ({ ...a, count: rand(30, 90), pct: 0 }))
  );
  const [signals, setSignals] = useState<SignalState[]>(() =>
    ARMS.map((a, i) => ({ armId: a.id, phase: i === 0 ? 'GREEN' : 'RED', timer: i === 0 ? 45 : rand(10, 50) }))
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertIdRef = useRef(0);

  const junction = JUNCTIONS.find(j => j.id === junctionId)!;

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setClock(timeNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Arm density simulation ──
  useEffect(() => {
    const t = setInterval(() => {
      setArms(prev => prev.map(a => {
        const count = Math.max(5, Math.min(120, a.count + rand(-12, 14)));
        return { ...a, count, pct: Math.round((count / 120) * 100) };
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // ── Signal phase engine ──
  useEffect(() => {
    const t = setInterval(() => {
      setSignals(prev => {
        const next = prev.map(s => ({ ...s, timer: s.timer - 1 }));
        const greenIdx = next.findIndex(s => s.phase === 'GREEN');
        const yellowIdx = next.findIndex(s => s.phase === 'YELLOW');

        if (greenIdx !== -1 && next[greenIdx].timer <= 5 && next[greenIdx].phase === 'GREEN') {
          next[greenIdx] = { ...next[greenIdx], phase: 'YELLOW', timer: 5 };
        } else if (yellowIdx !== -1 && next[yellowIdx].timer <= 0) {
          next[yellowIdx] = { ...next[yellowIdx], phase: 'RED', timer: 60 };
          const nextGreenIdx = (yellowIdx + 1) % next.length;
          next[nextGreenIdx] = { ...next[nextGreenIdx], phase: 'GREEN', timer: adaptive ? Math.max(15, Math.round((arms[nextGreenIdx].count / 120) * 60)) : 45 };
        }
        return next.map(s => ({ ...s, timer: Math.max(0, s.timer) }));
      });
    }, 1000);
    return () => clearInterval(t);
  }, [adaptive, arms]);

  // ── Alert generator ──
  const generateAlert = useCallback(() => {
    const heavy = [...arms].sort((a, b) => b.pct - a.pct)[0];
    const msgs = [
      `High density on ${heavy.label} — ${heavy.count} vehicles detected`,
      `Signal phase extended for ${heavy.label} arm due to congestion`,
      `Travellers on ${heavy.label} route notified of alternate path`,
      `Ward ${junction.wards[0]} complaint linked to ${heavy.label} slowdown`,
      `Adaptive signal reduced wait by ${rand(10, 35)}% on ${ARMS.find(a => a.id !== heavy.id)?.label}`,
    ];
    const levels: Alert['level'][] = heavy.pct > 70 ? ['critical', 'warning'] : heavy.pct > 40 ? ['warning', 'info'] : ['info'];
    setAlerts(prev => [{
      id: ++alertIdRef.current,
      arm: heavy.id,
      msg: msgs[rand(0, msgs.length - 1)],
      level: levels[rand(0, levels.length - 1)],
      time: timeNow(),
    }, ...prev.slice(0, 14)]);
  }, [arms, junction]);

  useEffect(() => {
    const t = setInterval(generateAlert, rand(8000, 18000));
    return () => clearInterval(t);
  }, [generateAlert]);

  // ── NammaFix complaints for this junction ──
  const nfComplaints: NfComplaint[] = (COMPLAINTS as Complaint[])
    .filter(c => junction.wards.includes(c.wardId))
    .map(c => ({ ...c, aiClassification: c.aiClassification ?? '' }));

  const totalVehicles = arms.reduce((s, a) => s + a.count, 0);
  const heaviestArm = [...arms].sort((a, b) => b.pct - a.pct)[0];
  const avgWait = Math.round(arms.reduce((s, a) => s + (a.pct / 100) * 60, 0) / 4);
  const criticalAlerts = alerts.filter(a => a.level === 'critical').length;

  const alertBorderColor = { critical: 'border-l-red-500', warning: 'border-l-amber-500', info: 'border-l-blue-500' };
  const alertTextColor = { critical: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400' };

  return (
    <div className="flex flex-col h-full bg-[#060910]">

      {/* Page header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Traffic Control</h1>
            <p className="text-slate-600 text-xs">{junction.name} · {clock}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Junction selector */}
          <div className="relative">
            <button
              onClick={() => setShowJunctionDrop(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs hover:bg-white/[0.08] transition-colors"
            >
              <MapPin className="w-3 h-3" />
              {junction.name}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showJunctionDrop && (
              <div className="absolute right-0 mt-1 w-56 bg-[#1e293b] border border-white/[0.1] rounded-lg shadow-xl z-20 overflow-hidden">
                {JUNCTIONS.map(j => (
                  <button key={j.id} onClick={() => { setJunctionId(j.id); setShowJunctionDrop(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors ${j.id === junctionId ? 'text-orange-400' : 'text-slate-300'}`}>
                    {j.name}
                  </button>
                ))}
                <div className="border-t border-white/[0.06]">
                  <button onClick={() => { alert('Coming soon — connect more Bangalore junctions'); setShowJunctionDrop(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-white/[0.06] flex items-center gap-1.5">
                    <Plus className="w-3 h-3" /> Add Junction
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Adaptive toggle */}
          <button
            onClick={() => setAdaptive(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              adaptive ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
            }`}
          >
            <Zap className="w-3 h-3" />
            {adaptive ? 'Adaptive On' : 'Manual'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Activity, label: 'Total Vehicles', value: totalVehicles.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: AlertTriangle, label: 'Busiest Arm', value: `${heaviestArm.label.split(' · ')[1]} ${heaviestArm.pct}%`, color: densityClass(heaviestArm.pct).text, bg: `bg-[${heaviestArm.color}]/10` },
            { icon: Clock, label: 'Avg Wait (est)', value: `${avgWait}s`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: AlertTriangle, label: 'Critical Alerts', value: criticalAlerts.toString(), color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className={`text-base font-bold ${color}`}>{value}</p>
                <p className="text-slate-600 text-[11px]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Junction SVG + arm cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-300 text-sm font-semibold">Junction Diagram — Live Density</p>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                </span>
              </div>
              <JunctionSVG arms={arms} />
            </div>

            {/* Arm density cards */}
            <div className="grid grid-cols-2 gap-3">
              {arms.map((arm) => {
                const dc = densityClass(arm.pct);
                const sig = signals.find(s => s.armId === arm.id)!;
                const phaseColor = sig.phase === 'GREEN' ? 'text-emerald-400' : sig.phase === 'YELLOW' ? 'text-amber-400' : 'text-red-400';
                return (
                  <div key={arm.id} className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{arm.label}</p>
                      <span className={`text-[10px] font-bold ${phaseColor}`}>{sig.phase} {sig.timer}s</span>
                    </div>
                    <p className={`text-2xl font-bold ${dc.text}`}>{arm.count}</p>
                    <p className="text-slate-600 text-[10px] mb-2">vehicles detected</p>
                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${arm.pct}%`, background: dc.bar }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${dc.badge}`}>{dc.label}</span>
                      <span className="text-slate-600 text-[10px]">{arm.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: signals + alerts */}
          <div className="space-y-4">
            {/* Signal phase panel */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <p className="text-slate-300 text-sm font-semibold mb-3">Signal Phases</p>
              <div className="space-y-3">
                {arms.map(arm => {
                  const sig = signals.find(s => s.armId === arm.id)!;
                  const phaseColor = sig.phase === 'GREEN' ? 'text-emerald-400' : sig.phase === 'YELLOW' ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={arm.id} className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                      <SignalLight phase={sig.phase} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{arm.label}</p>
                        <p className={`text-xs font-bold ${phaseColor}`}>{sig.phase} · {sig.timer}s</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NammaFix complaints */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-300 text-sm font-semibold">🔥 NammaFix Issues</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                  Ward {junction.wards.join(', ')}
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nfComplaints.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-4">No complaints for this junction's wards</p>
                ) : nfComplaints.map(c => (
                  <div key={c.id} className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-xs text-slate-300 font-medium leading-snug mb-1 line-clamp-1">{c.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold ${c.severity === 'critical' ? 'text-red-400' : c.severity === 'high' ? 'text-orange-400' : 'text-amber-400'}`}>
                        {c.severity}
                      </span>
                      <span className="text-[10px] text-slate-600">👍 {c.upvotes}</span>
                      {c.hoursElapsed > c.slaHours && (
                        <span className="text-[10px] text-red-400 font-semibold">⏰ OVERDUE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert stream */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-300 text-sm font-semibold">Live Alerts</p>
                <span className="text-[10px] text-slate-600">{alerts.length} events</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-4">Monitoring junction...</p>
                ) : alerts.map(a => (
                  <div key={a.id} className={`p-2.5 bg-white/[0.03] rounded-lg border-l-2 border border-white/[0.05] ${alertBorderColor[a.level]}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[10px] font-bold uppercase ${alertTextColor[a.level]}`}>{a.level}</span>
                      <span className="text-[10px] text-slate-600">{a.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{a.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ward accountability */}
        <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5">
          <p className="text-slate-300 text-sm font-semibold mb-4">Ward Accountability — Junction Area</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { ward: 6,   name: 'Hebbal',       corp: 'Ramesh Gowda',    party: 'BJP', rate: 87, arm: 'North', color: '#3b82f6' },
              { ward: 85,  name: 'Kalyan Nagar', corp: 'Suresh Rao',      party: 'JD(S)', rate: 74, arm: 'East', color: '#f59e0b' },
              { ward: 5,   name: 'RT Nagar',     corp: 'Latha Venkatesh', party: 'INC', rate: 57, arm: 'South', color: '#a855f7' },
              { ward: 110, name: 'Manyata',      corp: 'Bharath Nair',    party: 'BJP', rate: 79, arm: 'West', color: '#22c55e' },
            ].map(w => {
              const rateColor = w.rate >= 80 ? 'text-emerald-400' : w.rate >= 60 ? 'text-amber-400' : 'text-red-400';
              const rateBar = w.rate >= 80 ? '#22c55e' : w.rate >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={w.ward} className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Ward {w.ward} · {w.arm}</span>
                    <span className="w-2 h-2 rounded-full" style={{ background: w.color }} />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">{w.name}</p>
                  <p className="text-[10px] text-slate-600 mb-2">{w.corp} · {w.party}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${w.rate}%`, background: rateBar }} />
                    </div>
                    <span className={`text-[10px] font-bold ${rateColor}`}>{w.rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
