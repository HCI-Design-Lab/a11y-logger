import { Badge } from '@/components/ui/badge';
import type { Assessment } from '@/lib/db/assessments';

const statusConfig: Record<Assessment['status'], { label: string; className: string }> = {
  ready: {
    label: 'Ready',
    className: 'bg-gray-100 border border-gray-500 text-primary dark:text-primary-foreground',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 border border-blue-500 text-primary dark:text-primary-foreground',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground',
  },
};

interface AssessmentStatusBadgeProps {
  status: Assessment['status'];
}

export function AssessmentStatusBadge({ status }: AssessmentStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
}
