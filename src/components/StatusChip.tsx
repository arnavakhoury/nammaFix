import type { ComplaintStatus } from '../types';

const statusConfig: Record<ComplaintStatus, { label: string; classes: string }> = {
  open:        { label: 'Open',        classes: 'bg-white/[0.07] text-slate-400 border-white/[0.1]' },
  assigned:    { label: 'Assigned',    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  resolved:    { label: 'Resolved',    classes: 'bg-green-500/15 text-green-400 border-green-500/20' },
  escalated:   { label: 'Escalated',   classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

interface Props {
  status: ComplaintStatus;
  className?: string;
}

export default function StatusChip({ status, className = '' }: Props) {
  const { label, classes } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes} ${className}`}
    >
      {label}
    </span>
  );
}
