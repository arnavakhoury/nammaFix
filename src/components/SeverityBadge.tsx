import type { Severity } from '../types';

const severityConfig: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'Critical', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
  high:     { label: 'High',     classes: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  medium:   { label: 'Medium',   classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  low:      { label: 'Low',      classes: 'bg-green-500/15 text-green-400 border-green-500/20' },
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
