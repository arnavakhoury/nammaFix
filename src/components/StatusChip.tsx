import type { ComplaintStatus } from '../types';

const statusConfig: Record<ComplaintStatus, { label: string; classes: string }> = {
  open:        { label: 'Open',        classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  assigned:    { label: 'Assigned',    classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved:    { label: 'Resolved',    classes: 'bg-green-100 text-green-700 border-green-200' },
  escalated:   { label: 'Escalated',   classes: 'bg-red-100 text-red-700 border-red-200' },
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
