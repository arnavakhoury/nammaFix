import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { COMPLAINTS, CORPORATORS, MLAS, getWardStats, getComplaintsByCorporator } from '../data';
import type { IssueType } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">{rating.toFixed(1)}</span>
    </span>
  );
}

const partyColors: Record<string, string> = {
  INC:   'bg-blue-100 text-blue-700',
  BJP:   'bg-orange-100 text-orange-700',
  'JD(S)': 'bg-green-100 text-green-700',
  AIMIM: 'bg-teal-100 text-teal-700',
};
function partyBadgeClass(party: string) {
  return partyColors[party] ?? 'bg-gray-100 text-gray-600';
}

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  garbage: 'Garbage',
  flooding: 'Flooding',
  encroachment: 'Encroachment',
  sewage: 'Sewage',
  tree: 'Fallen Tree',
  other: 'Other',
};

const ISSUE_TYPE_COLORS: Record<IssueType, string> = {
  pothole:      'bg-stone-500',
  streetlight:  'bg-sky-500',
  garbage:      'bg-lime-500',
  flooding:     'bg-blue-500',
  encroachment: 'bg-purple-500',
  sewage:       'bg-teal-500',
  tree:         'bg-green-500',
  other:        'bg-gray-500',
};

// ── Computed stats ────────────────────────────────────────────────────────────
const totalComplaints = COMPLAINTS.length;
const resolvedCount = COMPLAINTS.filter(c => c.status === 'resolved').length;
const resolveRate = Math.round((resolvedCount / totalComplaints) * 100);
const avgResponse = Math.round(COMPLAINTS.reduce((sum, c) => sum + c.hoursElapsed, 0) / totalComplaints);

// Issue type breakdown
const issueTypeCounts = COMPLAINTS.reduce<Record<string, number>>((acc, c) => {
  acc[c.type] = (acc[c.type] ?? 0) + 1;
  return acc;
}, {});
const sortedIssueTypes = (Object.entries(issueTypeCounts) as [IssueType, number][])
  .sort((a, b) => b[1] - a[1]);
const maxIssueCount = sortedIssueTypes[0]?.[1] ?? 1;

// Corporator leaderboard sorted by rating desc
const corpLeaderboard = [...CORPORATORS]
  .map(c => ({
    ...c,
    resolveRate: c.totalComplaints > 0
      ? Math.round((c.resolvedOnTime / c.totalComplaints) * 100)
      : 0,
  }))
  .sort((a, b) => b.rating - a.rating);

// MLA leaderboard sorted by rating desc
const mlaLeaderboard = [...MLAS].sort((a, b) => b.rating - a.rating);

// Ward heat ranking
const wardStats = getWardStats();
const worstWards = [...wardStats]
  .sort((a, b) => b.openComplaints - a.openComplaints)
  .slice(0, 3);
const bestWards = [...wardStats]
  .sort((a, b) => b.resolveRate - a.resolveRate)
  .slice(0, 3);

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScoreboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="text-center py-8 bg-white rounded-xl border border-gray-200">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Accountability Dashboard</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          Every representative's performance, publicly visible. No hiding. No excuses.
        </p>
      </section>

      {/* ── City summary stats ────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-3xl font-black text-orange-500 mb-1">{totalComplaints.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Complaints Tracked</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-5 text-center">
            <div className="text-3xl font-black text-green-600 mb-1">{resolveRate}%</div>
            <div className="text-sm text-gray-500">City Resolve Rate</div>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-5 text-center">
            <div className="text-3xl font-black text-blue-600 mb-1">{avgResponse}h</div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
        </div>
      </section>

      {/* ── Corporator Leaderboard ────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Corporator Leaderboard</h2>
        <p className="text-xs text-gray-500 mb-4">Ranked by public rating. Bottom performers highlighted in red.</p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Corporator</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ward</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trend</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {corpLeaderboard.map((corp, idx) => {
                  const isShamed = idx >= corpLeaderboard.length - 2;
                  const corpComplaints = getComplaintsByCorporator(corp.id);
                  const openCount = corpComplaints.filter(c => c.status !== 'resolved').length;
                  return (
                    <tr
                      key={corp.id}
                      className={`border-b border-gray-50 transition-colors ${isShamed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-bold text-lg">
                        {idx < 3 ? RANK_MEDALS[idx] : <span className="text-gray-400 text-sm">#{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={corp.photo}
                            alt={corp.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{corp.name}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${partyBadgeClass(corp.party)}`}>
                              {corp.party}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        Ward {corp.ward} — {corp.wardName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{corp.totalComplaints}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{corp.resolvedOnTime}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${corp.resolveRate >= 70 ? 'text-green-600' : corp.resolveRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {corp.resolveRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StarRow rating={corp.rating} />
                      </td>
                      <td className="px-4 py-3">
                        {corp.trend === 'up'
                          ? <TrendingUp className="w-4 h-4 text-green-500" />
                          : corp.trend === 'down'
                          ? <TrendingDown className="w-4 h-4 text-red-500" />
                          : <Minus className="w-4 h-4 text-gray-400" />
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/corporator/${corp.id}`}
                          className="text-xs text-orange-600 font-semibold hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                        {isShamed && openCount > 0 && (
                          <div className="text-[10px] text-red-500 font-semibold mt-0.5">{openCount} open</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── MLA Leaderboard ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">MLA Leaderboard</h2>
        <p className="text-xs text-gray-500 mb-4">Members of the Legislative Assembly ranked by public accountability rating.</p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MLA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Constituency</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolve Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                </tr>
              </thead>
              <tbody>
                {mlaLeaderboard.map((mla, idx) => {
                  const isShamed = idx >= mlaLeaderboard.length - 1;
                  return (
                    <tr
                      key={mla.id}
                      className={`border-b border-gray-50 transition-colors ${isShamed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-bold text-lg">
                        {idx < 3 ? RANK_MEDALS[idx] : <span className="text-gray-400 text-sm">#{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={mla.photo}
                            alt={mla.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{mla.name}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${partyBadgeClass(mla.party)}`}>
                              {mla.party}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mla.constituency}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{mla.totalComplaints.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${mla.resolvedRate >= 70 ? 'bg-green-500' : mla.resolvedRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${mla.resolvedRate}%` }}
                            />
                          </div>
                          <span className={`font-bold ${mla.resolvedRate >= 70 ? 'text-green-600' : mla.resolvedRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {mla.resolvedRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StarRow rating={mla.rating} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Issue Type Breakdown ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Issue Type Breakdown</h2>
        <div className="space-y-3">
          {sortedIssueTypes.map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-medium w-28 flex-shrink-0">
                {ISSUE_TYPE_LABELS[type as IssueType]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full flex items-center justify-end pr-2 ${ISSUE_TYPE_COLORS[type as IssueType]} transition-all`}
                  style={{ width: `${(count / maxIssueCount) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">{count}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-6 flex-shrink-0 text-right">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ward Heat Ranking ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ward Heat Ranking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Most problematic wards */}
          <div className="bg-white rounded-xl border border-red-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔥</span>
              <h3 className="font-bold text-gray-900 text-sm">Most Problematic Wards</h3>
            </div>
            <div className="space-y-3">
              {worstWards.map((ws, idx) => (
                <div key={ws.ward} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center flex-shrink-0">
                    {idx === 0 ? '🚨' : idx === 1 ? '⚠️' : '🟡'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{ws.wardName}</span>
                      <span className="text-red-600 font-bold text-sm flex-shrink-0">{ws.openComplaints} open</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">Ward {ws.ward}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{ws.corporator.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className={`text-xs font-semibold ${ws.resolveRate < 50 ? 'text-red-600' : 'text-amber-600'}`}>
                        {ws.resolveRate}% resolved
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best performing wards */}
          <div className="bg-white rounded-xl border border-green-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✅</span>
              <h3 className="font-bold text-gray-900 text-sm">Best Performing Wards</h3>
            </div>
            <div className="space-y-3">
              {bestWards.map((ws, idx) => (
                <div key={ws.ward} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center flex-shrink-0">
                    {RANK_MEDALS[idx] ?? '🏅'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{ws.wardName}</span>
                      <span className="text-green-600 font-bold text-sm flex-shrink-0">{ws.resolveRate}% resolved</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">Ward {ws.ward}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{ws.corporator.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{ws.openComplaints} open</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
