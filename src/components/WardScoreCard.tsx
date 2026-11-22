import { Link } from 'react-router-dom';
import type { Corporator } from '../types';

interface Props {
  corporator: Corporator;
}

function resolutionColor(rate: number) {
  if (rate >= 80) return { bar: 'bg-green-500', text: 'text-green-400', ring: 'stroke-green-500' };
  if (rate >= 60) return { bar: 'bg-amber-500', text: 'text-amber-400', ring: 'stroke-amber-500' };
  return { bar: 'bg-red-500', text: 'text-red-400', ring: 'stroke-red-500' };
}

function trendArrow(trend: Corporator['trend']) {
  if (trend === 'up')   return { arrow: '↑', classes: 'text-green-400' };
  if (trend === 'down') return { arrow: '↓', classes: 'text-red-400' };
  return { arrow: '→', classes: 'text-slate-500' };
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-sm" aria-label={`${rating} stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="text-orange-400">★</span>
      ))}
      {half && <span className="text-orange-300">½</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="text-slate-700">★</span>
      ))}
      <span className="ml-1 text-xs text-slate-500 font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

// Circular SVG progress
function CircularProgress({ rate, color }: { rate: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - rate / 100);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} strokeWidth="6" className="stroke-white/[0.07] fill-none" />
      <circle
        cx="36" cy="36" r={r}
        strokeWidth="6"
        className={`fill-none transition-all ${color}`}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WardScoreCard({ corporator }: Props) {
  const rate = corporator.totalComplaints > 0
    ? Math.round((corporator.resolvedOnTime / corporator.totalComplaints) * 100)
    : 0;

  const colors = resolutionColor(rate);
  const trend = trendArrow(corporator.trend);

  return (
    <Link
      to={`/corporator/${corporator.id}`}
      className="block bg-[#0d1117] rounded-xl border border-white/[0.07] p-4 hover:border-orange-500/30 hover:bg-[#111827] transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      {/* Header: photo + name + ward */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={corporator.photo}
          alt={corporator.name}
          className="w-12 h-12 rounded-full object-cover bg-[#111827] border border-white/[0.1]"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{corporator.name}</p>
          <p className="text-xs text-slate-500 truncate">Ward {corporator.ward} · {corporator.wardName}</p>
          <p className="text-xs text-slate-600">{corporator.party} · Since {corporator.since}</p>
        </div>
      </div>

      {/* Circular progress + rate */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative flex-shrink-0">
          <CircularProgress rate={rate} color={colors.ring} />
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colors.text}`}>
            {rate}%
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-1">Resolution rate</p>
          <div className="w-full bg-white/[0.07] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${colors.bar}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-sm font-bold ${trend.classes}`}>{trend.arrow}</span>
            <span className="text-xs text-slate-600 capitalize">{corporator.trend}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-sm font-bold text-slate-200">{corporator.totalComplaints}</p>
          <p className="text-[10px] text-slate-600">Total</p>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400">{corporator.pendingOver7Days}</p>
          <p className="text-[10px] text-slate-600">Pending 7d</p>
        </div>
        <div>
          <p className="text-sm font-bold text-red-400">{corporator.ignoredOver30Days}</p>
          <p className="text-[10px] text-slate-600">Ignored 30d</p>
        </div>
      </div>

      {/* Star rating */}
      <StarRating rating={corporator.rating} />
    </Link>
  );
}
