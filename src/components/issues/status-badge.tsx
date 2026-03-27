import { Badge } from '@/components/ui/badge';
import type { Issue } from '@/lib/db/issues';

const statusConfig: Record<Issue['status'], { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 border border-blue-500 text-primary dark:text-primary-foreground' },
  resolved: { label: 'Resolved', className: 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground' },
  wont_fix: { label: "Won't Fix", className: 'bg-gray-100 border border-gray-500 text-primary dark:text-primary-foreground' },
};

interface StatusBadgeProps {
  status: Issue['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
}
