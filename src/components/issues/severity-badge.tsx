import type { Issue } from '@/lib/db/issues';

const severityConfig: Record<Issue['severity'], { label: string; className: string; dot: string }> =
  {
    critical: {
      label: 'Critical',
      className: 'bg-red-500/20 text-red-900 border border-red-500',
      dot: 'bg-red-500',
    },
    high: {
      label: 'High',
      className: 'bg-orange-500/20 text-orange-900 border border-orange-500',
      dot: 'bg-orange-500',
    },
    medium: {
      label: 'Medium',
      className: 'bg-yellow-500/20 text-yellow-900 border border-yellow-500',
      dot: 'bg-yellow-500',
    },
    low: {
      label: 'Low',
      className: 'bg-blue-500/20 text-blue-900 border border-blue-500',
      dot: 'bg-blue-500',
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
      <span className={`block rounded-full w-2 h-2 ${config.dot} mr-2`} />
      {config.label}
    </span>
  );
}
