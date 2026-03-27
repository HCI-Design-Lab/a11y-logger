import type { Report } from '@/lib/db/reports';

export function getStatusBadgeClass(status: Report['status']): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground';
    case 'draft':
    default:
      return 'bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground';
  }
}
