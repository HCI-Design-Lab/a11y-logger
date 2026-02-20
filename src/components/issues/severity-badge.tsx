import type { Issue } from '@/lib/db/issues';

const severityConfig: Record<Issue['severity'], { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

interface SeverityBadgeProps {
  severity: Issue['severity'];
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
