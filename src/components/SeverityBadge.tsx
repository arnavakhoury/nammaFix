import type { Severity } from '../types';

const severityConfig: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-200' },
  high:     { label: 'High',     classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium:   { label: 'Medium',   classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:      { label: 'Low',      classes: 'bg-green-100 text-green-700 border-green-200' },
};

interface Props {
  severity: Severity;
  className?: string;
}

export default function SeverityBadge({ severity, className = '' }: Props) {
  const { label, classes } = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${classes} ${className}`}
    >
      {label}
    </span>
  );
}
