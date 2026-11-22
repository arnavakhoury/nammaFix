import { Link } from 'react-router-dom';
import type { Corporator } from '../types';

interface Props {
  corporator: Corporator;
}

function resolutionColor(rate: number) {
  if (rate >= 80) return { bar: 'bg-green-500', text: 'text-green-600', ring: 'stroke-green-500' };
  if (rate >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600', ring: 'stroke-amber-500' };
  return { bar: 'bg-red-500', text: 'text-red-600', ring: 'stroke-red-500' };
}

function trendArrow(trend: Corporator['trend']) {
  if (trend === 'up')   return { arrow: '↑', classes: 'text-green-500' };
  if (trend === 'down') return { arrow: '↓', classes: 'text-red-500' };
  return { arrow: '→', classes: 'text-gray-400' };
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
        <span key={`e${i}`} className="text-gray-200">★</span>
      ))}
      <span className="ml-1 text-xs text-gray-500 font-medium">{rating.toFixed(1)}</span>
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
      <circle cx="36" cy="36" r={r} strokeWidth="6" className="stroke-gray-100 fill-none" />
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
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      {/* Header: photo + name + ward */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={corporator.photo}
          alt={corporator.name}
          className="w-12 h-12 rounded-full object-cover bg-gray-100 border border-gray-200"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{corporator.name}</p>
          <p className="text-xs text-gray-500 truncate">Ward {corporator.ward} · {corporator.wardName}</p>
          <p className="text-xs text-gray-400">{corporator.party} · Since {corporator.since}</p>
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
          <p className="text-xs text-gray-500 mb-1">Resolution rate</p>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${colors.bar}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-sm font-bold ${trend.classes}`}>{trend.arrow}</span>
            <span className="text-xs text-gray-400 capitalize">{corporator.trend}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{corporator.totalComplaints}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-600">{corporator.pendingOver7Days}</p>
          <p className="text-[10px] text-gray-400">Pending 7d</p>
        </div>
        <div>
          <p className="text-sm font-bold text-red-600">{corporator.ignoredOver30Days}</p>
          <p className="text-[10px] text-gray-400">Ignored 30d</p>
        </div>
      </div>

      {/* Star rating */}
      <StarRating rating={corporator.rating} />
    </Link>
  );
}
