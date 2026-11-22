import { useNavigate } from 'react-router-dom';
import { MapPin, ThumbsUp, Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import type { Complaint, IssueType } from '../types';
import SeverityBadge from './SeverityBadge';
import StatusChip from './StatusChip';

// ── Type badge config ─────────────────────────────────────────────────────────
const typeConfig: Record<IssueType, { label: string; classes: string }> = {
  pothole:      { label: 'Pothole',      classes: 'bg-stone-500/15 text-stone-400 border-stone-500/20' },
  streetlight:  { label: 'Streetlight',  classes: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  garbage:      { label: 'Garbage',      classes: 'bg-lime-500/15 text-lime-400 border-lime-500/20' },
  flooding:     { label: 'Flooding',     classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  encroachment: { label: 'Encroachment', classes: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  sewage:       { label: 'Sewage',       classes: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  tree:         { label: 'Fallen Tree',  classes: 'bg-green-500/15 text-green-400 border-green-500/20' },
  other:        { label: 'Other',        classes: 'bg-white/[0.07] text-slate-400 border-white/[0.1]' },
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
      className="bg-[#0d1117] rounded-xl border border-white/[0.07] p-4 flex gap-4 hover:border-orange-500/30 hover:bg-[#111827] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      {/* Photo thumbnail */}
      <div className="flex-shrink-0">
        <img
          src={photoUrl}
          alt={title}
          className="w-20 h-20 rounded-lg object-cover bg-[#111827]"
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Photo'; }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">{title}</h3>
          <StatusChip status={status} className="flex-shrink-0" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeCfg.classes}`}>
            {typeCfg.label}
          </span>
          <SeverityBadge severity={severity} />
          {ccedMLA && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border bg-purple-500/15 text-purple-400 border-purple-500/20">
              <Flame className="w-3 h-3" />
              CC MLA
            </span>
          )}
        </div>

        {/* Address */}
        <p className="flex items-center gap-1 text-xs text-slate-500 mb-2 truncate">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <span className="truncate">{address}</span>
        </p>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {/* Upvotes */}
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-600" />
            {upvotes}
          </span>

          {/* Escalation */}
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-400 font-medium">L{escalationLevel}</span>
          </span>

          {/* SLA timer */}
          {isOverdue ? (
            <span className="flex items-center gap-1 font-semibold text-red-400">
              <Clock className="w-3.5 h-3.5" />
              OVERDUE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              {remaining}h left
            </span>
          )}

          {/* Filed date */}
          <span className="ml-auto text-slate-600">{daysAgo(filedAt)}</span>
        </div>
      </div>
    </div>
  );
}
