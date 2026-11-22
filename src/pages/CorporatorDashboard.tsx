import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  CheckCircle, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Minus, Star, Users, Hammer, RefreshCw, Eye,
} from 'lucide-react';
import { CORPORATORS, getComplaintsByCorporator, getMLAById } from '../data';
import type { Complaint, Severity } from '../types';
import ComplaintCard from '../components/ComplaintCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </span>
  );
}

const partyColors: Record<string, string> = {
  INC:   'bg-blue-100 text-blue-700 border-blue-200',
  BJP:   'bg-orange-100 text-orange-700 border-orange-200',
  'JD(S)': 'bg-green-100 text-green-700 border-green-200',
  AIMIM: 'bg-teal-100 text-teal-700 border-teal-200',
};
function partyBadgeClass(party: string) {
  return partyColors[party] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

const severityColor: Record<Severity, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
};

// ── Monthly performance fake data ─────────────────────────────────────────────
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
function genMonthlyData(resolvedOnTime: number, totalComplaints: number) {
  return MONTHS.map((month, i) => ({
    month,
    filed: Math.max(5, Math.round(totalComplaints / 6 + (i - 2) * 2 + Math.sin(i) * 3)),
    resolved: Math.max(2, Math.round(resolvedOnTime / 6 + (i - 2) * 1.5 + Math.cos(i) * 2)),
  }));
}

// ── Toast mock ────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const show = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
  return { toast, show };
}

type QueueTab = 'urgent' | 'pending' | 'resolved';

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CorporatorDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, show } = useToast();

  const [activeTab, setActiveTab] = useState<QueueTab>('urgent');

  const corporator = CORPORATORS.find(c => c.id === id);

  if (!corporator) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Corporator not found</h1>
        <p className="text-gray-500 mb-6">No corporator with ID <code className="bg-gray-100 px-1 rounded">{id}</code>.</p>
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { name, ward, wardName, party, photo, since,
    resolvedOnTime, totalComplaints, pendingOver7Days,
    ignoredOver30Days, rating, trend } = corporator;

  const resolutionRate = totalComplaints > 0
    ? Math.round((resolvedOnTime / totalComplaints) * 100) : 0;

  const allComplaints = getComplaintsByCorporator(corporator.id);
  const mla = allComplaints[0] ? getMLAById(allComplaints[0].mlaId) : null;

  const urgentComplaints = allComplaints.filter(
    c => (c.severity === 'critical' || c.status === 'escalated') && c.status !== 'resolved'
  );
  const pendingComplaints = allComplaints.filter(
    c => c.status !== 'resolved' && c.severity !== 'critical' && c.status !== 'escalated'
  );
  const resolvedComplaints = allComplaints.filter(c => c.status === 'resolved');

  const tabComplaints: Record<QueueTab, Complaint[]> = {
    urgent: urgentComplaints,
    pending: pendingComplaints,
    resolved: resolvedComplaints,
  };

  const monthlyData = genMonthlyData(resolvedOnTime, totalComplaints);
  const maxMonthlyVal = Math.max(...monthlyData.map(d => d.filed), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-24" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <img
              src={photo}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
            />
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">Ward {ward} — {wardName}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${partyBadgeClass(party)}`}>
                  {party}
                </span>
                <span className="text-xs text-gray-400">Since {since}</span>
              </div>
            </div>
            <div className="sm:ml-auto">
              <StarRow rating={rating} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Scorecard ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Live Scorecard</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{totalComplaints}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total this month</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-600">{resolvedOnTime}</div>
            <div className="text-xs text-gray-500 mt-0.5">Resolved on time</div>
            <div className="text-xs text-green-600 font-semibold mt-1">{resolutionRate}%</div>
          </div>
          <div className={`rounded-xl border p-4 ${pendingOver7Days > 10 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
            <div className={`text-2xl font-bold ${pendingOver7Days > 10 ? 'text-amber-600' : 'text-gray-900'}`}>{pendingOver7Days}</div>
            <div className="text-xs text-gray-500 mt-0.5">Pending &gt; 7 days</div>
            {pendingOver7Days > 10 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
                <AlertTriangle className="w-3 h-3" /> Warning
              </div>
            )}
          </div>
          <div className={`rounded-xl border p-4 ${ignoredOver30Days > 3 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className={`text-2xl font-bold ${ignoredOver30Days > 3 ? 'text-red-600' : 'text-gray-900'}`}>{ignoredOver30Days}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ignored &gt; 30 days</div>
            {ignoredOver30Days > 3 && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1">
                <AlertTriangle className="w-3 h-3" /> Danger
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Rating display ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <div className="text-5xl font-black text-gray-900 mb-1">{rating.toFixed(1)}</div>
            <StarRow rating={rating} />
          </div>
          <div className="sm:border-l sm:border-gray-200 sm:pl-6">
            <div className="flex items-center gap-2 mb-1">
              {trend === 'up'
                ? <TrendingUp className="w-5 h-5 text-green-500" />
                : trend === 'down'
                ? <TrendingDown className="w-5 h-5 text-red-500" />
                : <Minus className="w-5 h-5 text-gray-400" />
              }
              <span className={`font-semibold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{resolutionRate}%</span> resolution rate
            </p>
          </div>
          {mla && (
            <div className="sm:ml-auto flex items-center gap-2 text-sm text-gray-500">
              <img src={mla.photo} alt={mla.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
              <div>
                <p className="text-xs text-gray-400">MLA</p>
                <p className="font-medium text-gray-700 text-sm">{mla.name}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Performance bar chart ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Monthly Performance (Last 6 Months)</h2>
        <div className="flex items-end gap-3 h-32">
          {monthlyData.map(({ month, filed, resolved }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: '96px' }}>
                {/* Filed bar */}
                <div className="flex-1 bg-orange-200 rounded-t-sm relative group" style={{ height: `${(filed / maxMonthlyVal) * 96}px` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{filed}</span>
                </div>
                {/* Resolved bar */}
                <div className="flex-1 bg-green-400 rounded-t-sm relative group" style={{ height: `${(resolved / maxMonthlyVal) * 96}px` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-green-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{resolved}</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-200 inline-block" /> Filed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Resolved</span>
        </div>
      </section>

      {/* ── Complaint Queue ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Complaint Queue</h2>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['urgent', 'pending', 'resolved'] as QueueTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                activeTab === tab
                  ? tab === 'urgent'
                    ? 'bg-red-500 border-red-500 text-white'
                    : tab === 'resolved'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1.5 text-xs font-bold opacity-80">({tabComplaints[tab].length})</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {tabComplaints[activeTab].length > 0 ? (
            tabComplaints[activeTab].map(c => <ComplaintCard key={c.id} complaint={c} />)
          ) : (
            <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-gray-200">
              No {activeTab} complaints right now.
            </div>
          )}
        </div>
      </section>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => show('Field team assigned successfully!')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" /> Assign to Field Team
          </button>
          <button
            onClick={() => show('Extension request submitted!')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" /> Request Extension
          </button>
          <button
            onClick={() => show('All complaints marked as reviewed!')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" /> Mark All Reviewed
          </button>
          <button
            onClick={() => show('Report submitted to Zonal Commissioner!')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Hammer className="w-4 h-4" /> Escalate All Pending
          </button>
          <button
            onClick={() => show('Dashboard data refreshed!')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>
      </section>

      {/* ── Ward map ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Ward Complaint Map</h2>
        <div className="rounded-xl overflow-hidden border border-gray-200 h-[300px]">
          <MapContainer
            center={allComplaints.length > 0 ? [allComplaints[0].lat, allComplaints[0].lng] : [12.9716, 77.5946]}
            zoom={13}
            className="w-full h-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {allComplaints.map(c => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={10}
                pathOptions={{
                  color: severityColor[c.severity],
                  fillColor: severityColor[c.severity],
                  fillOpacity: 0.75,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold mb-1">{c.title}</p>
                    <p className="text-gray-500 capitalize">{c.type} · {c.severity}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>

    </div>
  );
}
