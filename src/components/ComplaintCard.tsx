import { useNavigate } from 'react-router-dom';
import { MapPin, ThumbsUp, Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import type { Complaint, IssueType } from '../types';
import SeverityBadge from './SeverityBadge';
import StatusChip from './StatusChip';

// ── Type badge config ─────────────────────────────────────────────────────────
const typeConfig: Record<IssueType, { label: string; classes: string }> = {
  pothole:      { label: 'Pothole',      classes: 'bg-stone-100 text-stone-700 border-stone-200' },
  streetlight:  { label: 'Streetlight',  classes: 'bg-sky-100 text-sky-700 border-sky-200' },
  garbage:      { label: 'Garbage',      classes: 'bg-lime-100 text-lime-700 border-lime-200' },
  flooding:     { label: 'Flooding',     classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  encroachment: { label: 'Encroachment', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  sewage:       { label: 'Sewage',       classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  tree:         { label: 'Fallen Tree',  classes: 'bg-green-100 text-green-700 border-green-200' },
  other:        { label: 'Other',        classes: 'bg-gray-100 text-gray-600 border-gray-200' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

interface Props {
  complaint: Complaint;
}

export default function ComplaintCard({ complaint }: Props) {
  const navigate = useNavigate();
  const {
    id, title, type, severity, status, address,
    upvotes, escalationLevel, photoUrl, filedAt,
    slaHours, hoursElapsed, ccedMLA,
  } = complaint;

  const isOverdue = hoursElapsed > slaHours;
  const remaining = slaHours - hoursElapsed;
  const typeCfg = typeConfig[type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/complaints/${id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/complaints/${id}`)}
      className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      {/* Photo thumbnail */}
      <div className="flex-shrink-0">
        <img
          src={photoUrl}
          alt={title}
          className="w-20 h-20 rounded-lg object-cover bg-gray-100"
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Photo'; }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</h3>
          <StatusChip status={status} className="flex-shrink-0" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeCfg.classes}`}>
            {typeCfg.label}
          </span>
          <SeverityBadge severity={severity} />
          {ccedMLA && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200">
              <Flame className="w-3 h-3" />
              CC MLA
            </span>
          )}
        </div>

        {/* Address */}
        <p className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">{address}</span>
        </p>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {/* Upvotes */}
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
            {upvotes}
          </span>

          {/* Escalation */}
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-600 font-medium">L{escalationLevel}</span>
          </span>

          {/* SLA timer */}
          {isOverdue ? (
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <Clock className="w-3.5 h-3.5" />
              OVERDUE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              {remaining}h left
            </span>
          )}

          {/* Filed date */}
          <span className="ml-auto text-gray-400">{daysAgo(filedAt)}</span>
        </div>
      </div>
    </div>
  );
}
