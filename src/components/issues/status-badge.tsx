'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { Issue } from '@/lib/db/issues';

const statusConfig: Record<Issue['status'], { className: string }> = {
  open: {
    className: 'bg-blue-100 border border-blue-500 text-primary dark:text-primary-foreground',
  },
  resolved: {
    className: 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground',
  },
  wont_fix: {
    className: 'bg-gray-100 border border-gray-500 text-primary dark:text-primary-foreground',
  },
};

interface StatusBadgeProps {
  status: Issue['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('issues.badge.status');
  const config = statusConfig[status] ?? { className: '' };
  return <Badge className={config.className}>{t(status)}</Badge>;
}
