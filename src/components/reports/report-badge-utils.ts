import type { Report } from '@/lib/db/reports';

export function getStatusBadgeClass(status: Report['status']): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}
