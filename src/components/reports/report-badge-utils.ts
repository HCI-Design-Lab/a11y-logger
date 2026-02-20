import type { Report } from '@/lib/db/reports';

export function getTypeBadgeClass(type: Report['type']): string {
  switch (type) {
    case 'executive':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'detailed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'custom':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusBadgeClass(status: Report['status']): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}
