import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertTriangle, CheckCircle, Map, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { COMPLAINTS, MLAS, getWardStats } from '../data';
import ComplaintCard from '../components/ComplaintCard';
import WardScoreCard from '../components/WardScoreCard';
import type { Severity } from '../types';

// ── Severity colours for map markers ─────────────────────────────────────────
const severityColor: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};
const severityRadius: Record<Severity, number> = {
  critical: 16,
  high: 12,
  medium: 9,
  low: 7,
};

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  animate?: boolean;
}
function StatCard({ icon, value, label, trend, trendLabel, iconBg, iconColor, valueColor, animate = false }: StatCardProps) {
  const counted = useCountUp(animate ? value : 0);
  const display = animate ? counted : value;
  return (
    <div className="bg-[#0d1117] rounded-xl border border-white/[0.07] p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${valueColor}`}>{display.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
        {trend && trendLabel && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${
            trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-slate-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Live feed filter tabs ─────────────────────────────────────────────────────
type FeedFilter = 'all' | 'critical' | 'escalated' | 'pending_sla';
const FEED_TABS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'pending_sla', label: 'Pending SLA' },
];

function getCount(filter: FeedFilter): number {
  if (filter === 'all') return COMPLAINTS.length;
  if (filter === 'critical') return COMPLAINTS.filter(c => c.severity === 'critical').length;
  if (filter === 'escalated') return COMPLAINTS.filter(c => c.status === 'escalated').length;
  return COMPLAINTS.filter(c => c.hoursElapsed > c.slaHours && c.status !== 'resolved').length;
}

function filterComplaints(filter: FeedFilter) {
  if (filter === 'all') return COMPLAINTS;
  if (filter === 'critical') return COMPLAINTS.filter(c => c.severity === 'critical');
  if (filter === 'escalated') return COMPLAINTS.filter(c => c.status === 'escalated');
  return COMPLAINTS.filter(c => c.hoursElapsed > c.slaHours && c.status !== 'resolved');
}

// ── Star rating display ───────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-orange-400 fill-orange-400' : 'text-slate-700 fill-slate-700'}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-slate-400">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CityDashboard() {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const criticalCount = COMPLAINTS.filter(c => c.severity === 'critical').length;
  const wardStats = getWardStats();
  // Sort ascending by resolve rate — worst first
  const sortedWards = [...wardStats].sort((a, b) => a.resolveRate - b.resolveRate);
  const worstWard = sortedWards[0];

  const filteredFeed = filterComplaints(feedFilter);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-[#060910] flex flex-col">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#0d1117]">
        <div>
          <h1 className="text-white text-lg font-bold leading-none">City Dashboard</h1>
          <p className="text-slate-500 text-xs mt-0.5">Bengaluru · Live</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live badge */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-bold text-red-400 tracking-widest">LIVE</span>
          </div>
          {/* Clock */}
          <span className="text-sm font-mono text-slate-400 tabular-nums hidden sm:block">{timeStr}</span>
          {/* CTA */}
          <Link
            to="/file"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors"
          >
            Report Issue
          </Link>
        </div>
      </header>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4">
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={847}
          label="Open complaints"
          trend="up"
          trendLabel="+12 today"
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
          valueColor="text-orange-400"
          animate
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={criticalCount}
          label="Critical issues"
          trend="up"
          trendLabel="needs action"
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
          valueColor="text-red-400"
          animate
        />
        <StatCard
          icon={<Map className="w-5 h-5" />}
          value={198}
          label="Wards tracked"
          iconBg="bg-blue-500/15"
          iconColor="text-blue-400"
          valueColor="text-slate-200"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          value={234}
          label="Resolved this week"
          trend="down"
          trendLabel="-5% vs last week"
          iconBg="bg-green-500/15"
          iconColor="text-green-400"
          valueColor="text-green-400"
        />
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────────── */}
      <div className="flex gap-4 px-6 pb-8 flex-1 min-h-0">

        {/* ── LEFT: Map + Feed ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Map section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-200">🗺 Complaint Heatmap</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/[0.07] text-slate-400 border border-white/[0.07]">
                {wardStats.length} wards
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-white/[0.07]">
              <div className="h-[320px]">
                <MapContainer
                  center={[12.9716, 77.5946]}
                  zoom={12}
                  className="w-full h-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {COMPLAINTS.map(c => (
                    <CircleMarker
                      key={c.id}
                      center={[c.lat, c.lng]}
                      radius={severityRadius[c.severity]}
                      pathOptions={{
                        color: severityColor[c.severity],
                        fillColor: severityColor[c.severity],
                        fillOpacity: 0.75,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-sm min-w-[180px]">
                          <p className="font-semibold mb-1">{c.title}</p>
                          <p className="text-gray-500 capitalize mb-0.5">{c.type} · {c.severity}</p>
                          <p className="text-gray-500 mb-0.5">👍 {c.upvotes} upvotes</p>
                          <p className="text-gray-500 mb-2 capitalize">Status: {c.status.replace('_', ' ')}</p>
                          <button
                            className="text-orange-600 font-medium hover:underline text-sm"
                            onClick={() => navigate(`/complaints/${c.id}`)}
                          >
                            View complaint →
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              {/* Legend overlay */}
              <div className="absolute bottom-3 right-3 z-[1000] bg-[#0d1117]/90 backdrop-blur-sm rounded-lg border border-white/[0.1] p-2.5 text-xs space-y-1.5">
                <p className="font-semibold text-slate-300 mb-1">Severity</p>
                {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: severityColor[s] }}
                    />
                    <span className="capitalize text-slate-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-slate-200">Live Complaint Feed</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mb-3">
              {FEED_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFeedFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    feedFilter === tab.key
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white/[0.04] border-white/[0.07] text-slate-400 hover:border-orange-500/40 hover:text-orange-400'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    feedFilter === tab.key ? 'bg-white/20 text-white' : 'bg-white/[0.07] text-slate-500'
                  }`}>
                    {getCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredFeed.map(c => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
              {filteredFeed.length === 0 && (
                <p className="text-center text-slate-600 py-10">No complaints match this filter.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <div className="w-80 shrink-0 hidden lg:flex flex-col gap-4">

          {/* Ward Scoreboard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-200">Ward Accountability</span>
            </div>

            {/* Shame board */}
            {worstWard && (
              <div className="mb-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <span className="text-red-400 text-base mt-0.5">🚨</span>
                <div>
                  <p className="text-xs font-bold text-red-400">
                    Bottom: {worstWard.wardName} (Ward {worstWard.ward})
                  </p>
                  <p className="text-[11px] text-red-500/80 mt-0.5">
                    {worstWard.resolveRate}% resolved · {worstWard.openComplaints} open
                  </p>
                  <p className="text-[11px] text-red-500/60 mt-0.5">
                    {worstWard.corporator.name} · {worstWard.corporator.party}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {sortedWards.map(ws => (
                <WardScoreCard key={ws.ward} corporator={ws.corporator} />
              ))}
            </div>
          </div>

          {/* MLA Scorecard */}
          <div>
            <span className="text-sm font-semibold text-slate-200 block mb-2">MLA Scorecard</span>
            <div className="space-y-2">
              {MLAS.map(mla => (
                <div key={mla.id} className="bg-[#0d1117] rounded-xl border border-white/[0.07] p-3">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img
                      src={mla.photo}
                      alt={mla.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/[0.1] bg-[#111827] flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{mla.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{mla.constituency}</p>
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">
                        {mla.party}
                      </span>
                    </div>
                  </div>

                  <StarRow rating={mla.rating} />

                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Resolve rate</span>
                      <span className={`font-semibold ${mla.resolvedRate >= 70 ? 'text-green-400' : mla.resolvedRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {mla.resolvedRate}%
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${mla.resolvedRate >= 70 ? 'bg-green-500' : mla.resolvedRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${mla.resolvedRate}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-300">{mla.totalComplaints.toLocaleString()}</span> total complaints
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
