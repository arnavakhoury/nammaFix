import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  colorClass?: string;
  animate?: boolean;
}
function StatCard({ icon, value, label, trend, trendLabel, colorClass = 'text-orange-500', animate = false }: StatCardProps) {
  const counted = useCountUp(animate ? value : 0);
  const display = animate ? counted : value;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${colorClass}`}>{display.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {trend && trendLabel && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400'}`}>
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
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CityDashboard() {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');

  const criticalCount = COMPLAINTS.filter(c => c.severity === 'critical').length;
  const wardStats = getWardStats();
  // Sort ascending by resolve rate — worst first
  const sortedWards = [...wardStats].sort((a, b) => a.resolveRate - b.resolveRate);
  const worstWard = sortedWards[0];

  const filteredFeed = filterComplaints(feedFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            value={847}
            label="Total open complaints"
            trend="up"
            trendLabel="+12 today"
            colorClass="text-orange-500"
            animate
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            value={criticalCount}
            label="Critical issues"
            trend="up"
            trendLabel="needs action"
            colorClass="text-red-500"
            animate
          />
          <StatCard
            icon={<Map className="w-6 h-6" />}
            value={198}
            label="Wards tracked"
            colorClass="text-blue-500"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            value={234}
            label="Resolved this week"
            trend="down"
            trendLabel="-5% vs last week"
            colorClass="text-green-500"
          />
        </div>
      </section>

      {/* ── Bangalore map ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Complaint Map — Bangalore</h2>
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <div className="h-[400px] md:h-[500px]">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              className="w-full h-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 shadow text-xs space-y-1.5">
            <p className="font-semibold text-gray-700 mb-1">Severity</p>
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: severityColor[s] }}
                />
                <span className="capitalize text-gray-600">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ward Scoreboard ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Ward Accountability Scoreboard</h2>

        {/* Shame board banner */}
        {worstWard && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-red-500 text-xl">🚨</span>
            <div>
              <p className="text-sm font-bold text-red-700">
                Bottom Ward: {worstWard.wardName} (Ward {worstWard.ward})
              </p>
              <p className="text-xs text-red-600">
                Only {worstWard.resolveRate}% resolved · {worstWard.openComplaints} open complaints ·
                Corporator: {worstWard.corporator.name} ({worstWard.corporator.party})
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWards.map(ws => (
            <WardScoreCard key={ws.ward} corporator={ws.corporator} />
          ))}
        </div>
      </section>

      {/* ── Live Feed ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <h2 className="text-lg font-bold text-gray-900">Live Complaint Feed</h2>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {FEED_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFeedFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                feedFilter === tab.key
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                feedFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {getCount(tab.key)}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredFeed.map(c => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
          {filteredFeed.length === 0 && (
            <p className="text-center text-gray-400 py-10">No complaints match this filter.</p>
          )}
        </div>
      </section>

      {/* ── MLA Scorecards ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">MLA Accountability</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MLAS.map(mla => (
            <div key={mla.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={mla.photo}
                  alt={mla.name}
                  className="w-14 h-14 rounded-full object-cover border border-gray-200"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{mla.name}</p>
                  <p className="text-xs text-gray-500">{mla.constituency}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                    {mla.party}
                  </span>
                </div>
              </div>

              <StarRow rating={mla.rating} />

              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Resolve rate</span>
                  <span className={`font-semibold ${mla.resolvedRate >= 70 ? 'text-green-600' : mla.resolvedRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {mla.resolvedRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${mla.resolvedRate >= 70 ? 'bg-green-500' : mla.resolvedRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${mla.resolvedRate}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{mla.totalComplaints.toLocaleString()}</span> total complaints
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
