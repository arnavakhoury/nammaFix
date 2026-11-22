import { useEffect, useState } from 'react';
import { Users, MapPin, TrendingUp, AlertTriangle, Clock, Activity, Bell } from 'lucide-react';
import { COMPLAINTS, CORPORATORS } from '../data';

// ── Types ─────────────────────────────────────────────────────────────────────
type CrowdLevel = 'low' | 'moderate' | 'high' | 'critical';

interface HotspotZone {
  id: string;
  name: string;
  area: string;
  crowdCount: number;
  capacity: number;
  level: CrowdLevel;
  lat: number;
  lng: number;
  wardId: number;
}

interface CrowdEvent {
  id: string;
  zone: string;
  message: string;
  ts: number;
  type: 'surge' | 'clear' | 'alert';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function crowdLevel(count: number, capacity: number): CrowdLevel {
  const pct = (count / capacity) * 100;
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'high';
  if (pct >= 45) return 'moderate';
  return 'low';
}
function levelColor(level: CrowdLevel): string {
  if (level === 'critical') return 'text-red-400';
  if (level === 'high')     return 'text-amber-400';
  if (level === 'moderate') return 'text-orange-400';
  return 'text-emerald-400';
}
function levelBarColor(level: CrowdLevel): string {
  if (level === 'critical') return 'bg-red-500';
  if (level === 'high')     return 'bg-amber-500';
  if (level === 'moderate') return 'bg-orange-500';
  return 'bg-emerald-500';
}
function levelBadge(level: CrowdLevel): string {
  if (level === 'critical') return 'bg-red-500/10 border-red-500/30 text-red-400';
  if (level === 'high')     return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  if (level === 'moderate') return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
  return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
}

function buildInitialZones(): HotspotZone[] {
  const zones: Omit<HotspotZone, 'level'>[] = [
    { id: 'z1', name: 'Nagawara Junction',    area: 'Hebbal',         crowdCount: 820,  capacity: 900,  lat: 13.0453, lng: 77.5967, wardId: 6   },
    { id: 'z2', name: 'Marathahalli Bridge',  area: 'Marathahalli',   crowdCount: 680,  capacity: 1000, lat: 12.9591, lng: 77.6974, wardId: 85  },
    { id: 'z3', name: 'Silk Board Junction',  area: 'Shivajinagar',   crowdCount: 950,  capacity: 1100, lat: 12.9176, lng: 77.6225, wardId: 73  },
    { id: 'z4', name: 'Hebbal Flyover',       area: 'Hebbal',         crowdCount: 410,  capacity: 800,  lat: 13.0463, lng: 77.5934, wardId: 6   },
    { id: 'z5', name: 'Koramangala 5th Blk',  area: 'Koramangala',    crowdCount: 310,  capacity: 600,  lat: 12.9352, lng: 77.6245, wardId: 68  },
    { id: 'z6', name: 'ITPL Main Road',       area: 'Whitefield',     crowdCount: 870,  capacity: 950,  lat: 12.9830, lng: 77.7351, wardId: 110 },
    { id: 'z7', name: 'Electronic City Gate', area: 'Electronic City', crowdCount: 220, capacity: 700,  lat: 12.8399, lng: 77.6770, wardId: 196 },
    { id: 'z8', name: 'Manyata Tech Park',    area: 'Manyata',        crowdCount: 540,  capacity: 750,  lat: 13.0472, lng: 77.6118, wardId: 6   },
  ];
  return zones.map(z => ({ ...z, level: crowdLevel(z.crowdCount, z.capacity) }));
}

// ── Live clock ────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Crowd heatmap SVG ─────────────────────────────────────────────────────────
function CrowdHeatmap({ zones }: { zones: HotspotZone[] }) {
  const colorFor = (level: CrowdLevel) => {
    if (level === 'critical') return '#ef4444';
    if (level === 'high')     return '#f59e0b';
    if (level === 'moderate') return '#f97316';
    return '#10b981';
  };
  const radiusFor = (level: CrowdLevel) => {
    if (level === 'critical') return 18;
    if (level === 'high')     return 14;
    if (level === 'moderate') return 11;
    return 8;
  };

  // Map lat/lng → SVG coords (Bangalore bounding box approx)
  const latRange = [12.82, 13.06];
  const lngRange = [77.49, 77.76];
  const W = 320, H = 240;
  const toX = (lng: number) => ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * W;
  const toY = (lat: number) => (1 - (lat - latRange[0]) / (latRange[1] - latRange[0])) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" aria-label="Crowd heatmap">
      <rect width={W} height={H} fill="#0a0e17" rx="8" />
      {/* Grid */}
      {[60, 120, 180, 240].map(x => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} stroke="#1e2740" strokeWidth="0.5" />
      ))}
      {[60, 120, 180].map(y => (
        <line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} stroke="#1e2740" strokeWidth="0.5" />
      ))}
      {/* Zones */}
      {zones.map(z => {
        const cx = toX(z.lng);
        const cy = toY(z.lat);
        const r = radiusFor(z.level);
        const color = colorFor(z.level);
        const pct = Math.round((z.crowdCount / z.capacity) * 100);
        return (
          <g key={z.id}>
            <circle cx={cx} cy={cy} r={r + 4} fill={color} fillOpacity={0.12} />
            <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.8} />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui">{pct}%</text>
          </g>
        );
      })}
      {/* Legend */}
      <text x="6" y="12" fill="#475569" fontSize="9" fontFamily="system-ui">Crowd Density Map · Bangalore</text>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CrowdIntelPage() {
  const clock = useClock();
  const [zones, setZones] = useState<HotspotZone[]>(buildInitialZones);
  const [events, setEvents] = useState<CrowdEvent[]>([]);
  const [filterLevel, setFilterLevel] = useState<CrowdLevel | 'all'>('all');

  // Simulation: crowd counts drift every 4s
  useEffect(() => {
    const id = setInterval(() => {
      setZones(prev => prev.map(z => {
        const newCount = clamp(z.crowdCount + rand(-40, 40), 50, z.capacity);
        const newLevel = crowdLevel(newCount, z.capacity);
        // Fire event if level changed to critical or cleared from critical
        if (newLevel !== z.level && (newLevel === 'critical' || z.level === 'critical')) {
          const ts = Date.now();
          setEvents(ev => [
            {
              id: `ev-${ts}-${z.id}`,
              zone: z.name,
              message: newLevel === 'critical' ? `${z.name} reached critical density!` : `${z.name} crowd level dropped to ${newLevel}.`,
              ts,
              type: newLevel === 'critical' ? 'alert' : 'clear',
            },
            ...ev.slice(0, 29),
          ]);
        }
        return { ...z, crowdCount: newCount, level: newLevel };
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Simulation: random surge events every 20–40s
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        const zone = zones[rand(0, zones.length - 1)];
        if (zone) {
          const ts = Date.now();
          setEvents(ev => [
            {
              id: `ev-surge-${ts}`,
              zone: zone.name,
              message: `Sudden crowd surge detected near ${zone.name}.`,
              ts,
              type: 'surge',
            },
            ...ev.slice(0, 29),
          ]);
        }
        schedule();
      }, rand(20000, 40000));
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const criticalZones = zones.filter(z => z.level === 'critical').length;
  const highZones = zones.filter(z => z.level === 'high').length;
  const totalCrowd = zones.reduce((s, z) => s + z.crowdCount, 0);
  const avgUtilisation = Math.round(zones.reduce((s, z) => s + (z.crowdCount / z.capacity) * 100, 0) / zones.length);

  const filteredZones = filterLevel === 'all' ? zones : zones.filter(z => z.level === filterLevel);

  const eventStyle: Record<CrowdEvent['type'], { border: string; badge: string; text: string }> = {
    alert: { border: 'border-red-500/40',   badge: 'text-red-400',   text: 'ALERT' },
    surge: { border: 'border-amber-500/40', badge: 'text-amber-400', text: 'SURGE' },
    clear: { border: 'border-emerald-500/40', badge: 'text-emerald-400', text: 'CLEAR' },
  };

  const nearbyCorps = CORPORATORS.filter(c => zones.some(z => z.wardId === c.ward));

  return (
    <div className="min-h-screen" style={{ background: '#060910' }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 px-6 py-4 border-b border-white/[0.06] bg-[#0d1117] flex items-center justify-between gap-4 flex-wrap">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-200 leading-tight">Crowd Intelligence</h1>
            <p className="text-[11px] text-slate-600 leading-tight flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Bengaluru · <span className="text-emerald-400">Live</span>
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <Activity className="w-3 h-3" />
            {zones.length} zones monitored
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500 font-mono tabular-nums">
            <Clock className="w-3 h-3" />
            {clock}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Total Tracked</span>
            </div>
            <p className="text-2xl font-bold text-slate-200 tabular-nums">{totalCrowd.toLocaleString()}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">across all zones</p>
          </div>

          <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Critical Zones</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${criticalZones > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{criticalZones}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">≥ 90% capacity</p>
          </div>

          <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">High Density</span>
            </div>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">{highZones}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">70–90% capacity</p>
          </div>

          <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Avg Utilisation</span>
            </div>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{avgUtilisation}%</p>
            <p className="text-[11px] text-slate-600 mt-0.5">city-wide average</p>
          </div>
        </div>

        {/* Two-column: heatmap + events */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-5">

          {/* Left: heatmap + zone cards */}
          <div className="space-y-4">

            {/* Heatmap */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200">Crowd Heatmap</h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  {(['critical', 'high', 'moderate', 'low'] as CrowdLevel[]).map(l => (
                    <span key={l} className={`flex items-center gap-1 ${levelColor(l)}`}>
                      <span className={`w-2 h-2 rounded-full ${levelBarColor(l)}`} />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <CrowdHeatmap zones={zones} />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'critical', 'high', 'moderate', 'low'] as const).map(lvl => {
                const count = lvl === 'all' ? zones.length : zones.filter(z => z.level === lvl).length;
                return (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      filterLevel === lvl
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterLevel === lvl ? 'bg-orange-500/20 text-orange-300' : 'bg-white/[0.05] text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zone cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredZones.map(z => {
                const pct = Math.round((z.crowdCount / z.capacity) * 100);
                return (
                  <div key={z.id} className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-300 truncate">{z.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {z.area}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${levelBadge(z.level)}`}>
                        {z.level}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2 mb-2">
                      <p className="text-xl font-bold text-slate-200 tabular-nums">{z.crowdCount.toLocaleString()}</p>
                      <p className="text-xs text-slate-600 pb-0.5">/ {z.capacity.toLocaleString()} cap</p>
                    </div>
                    <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden mb-1">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${levelBarColor(z.level)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className={`text-[11px] text-right tabular-nums ${levelColor(z.level)}`}>{pct}%</p>
                  </div>
                );
              })}
              {filteredZones.length === 0 && (
                <div className="col-span-2 py-10 text-center text-slate-600 text-sm">No zones match this filter.</div>
              )}
            </div>
          </div>

          {/* Right: events stream + corporators */}
          <div className="space-y-4">

            {/* Event stream */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Event Stream</h3>
                {events.length > 0 && (
                  <span className="ml-auto text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">{events.length}</span>
                )}
              </div>
              {events.length === 0 ? (
                <p className="text-xs text-slate-600 py-6 text-center">Monitoring… events will appear here.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {events.map(ev => {
                    const style = eventStyle[ev.type];
                    return (
                      <div key={ev.id} className={`text-[11px] border-l-2 pl-2 py-0.5 ${style.border}`}>
                        <p className={`font-semibold ${style.badge}`}>{style.text}</p>
                        <p className="text-slate-400 leading-snug">{ev.message}</p>
                        <p className="text-slate-700 mt-0.5">{new Date(ev.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Corporators for affected wards */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Ward Contacts</h3>
              <div className="space-y-3">
                {nearbyCorps.slice(0, 5).map(corp => {
                  const wardZones = zones.filter(z => z.wardId === corp.ward);
                  const worstLevel = wardZones.reduce<CrowdLevel>((best, z) => {
                    const order: CrowdLevel[] = ['critical', 'high', 'moderate', 'low'];
                    return order.indexOf(z.level) < order.indexOf(best) ? z.level : best;
                  }, 'low');
                  return (
                    <div key={corp.id} className="flex items-center gap-2.5">
                      <img
                        src={corp.photo}
                        alt={corp.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/[0.1] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300 font-medium truncate">{corp.name}</p>
                        <p className="text-[10px] text-slate-600">Ward {corp.ward} · {corp.wardName}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${levelBadge(worstLevel)}`}>
                        {worstLevel}
                      </span>
                    </div>
                  );
                })}
                {nearbyCorps.length === 0 && (
                  <p className="text-xs text-slate-600">No corporators matched.</p>
                )}
              </div>
            </div>

            {/* NammaFix complaints near zones */}
            <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">NammaFix Nearby</h3>
              </div>
              {(() => {
                const zoneWards = new Set(zones.map(z => z.wardId));
                const nearby = COMPLAINTS.filter(c => zoneWards.has(c.wardId)).slice(0, 5);
                if (nearby.length === 0) return <p className="text-xs text-slate-600">No complaints near monitored zones.</p>;
                return (
                  <div className="space-y-2">
                    {nearby.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className={`w-1 rounded-full flex-shrink-0 ${c.severity === 'critical' ? 'bg-red-500' : c.severity === 'high' ? 'bg-amber-500' : 'bg-orange-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-300 font-medium truncate leading-snug">{c.title}</p>
                          <p className="text-[10px] text-slate-600 truncate">{c.wardName} · <span className="capitalize">{c.status.replace('_', ' ')}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>

        {/* Bottom: trend bars per zone */}
        <div className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-200">Zone Utilisation Overview</h2>
          </div>
          <div className="space-y-3">
            {[...zones].sort((a, b) => b.crowdCount / b.capacity - a.crowdCount / a.capacity).map(z => {
              const pct = Math.round((z.crowdCount / z.capacity) * 100);
              return (
                <div key={z.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-36 flex-shrink-0 truncate">{z.name}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-700 ${levelBarColor(z.level)}`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 20 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold w-12 text-right flex-shrink-0 ${levelColor(z.level)}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
