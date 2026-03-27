import { getStatusBadgeClass } from '@/components/reports/report-badge-utils';

describe('getStatusBadgeClass', () => {
  test('returns green classes for published', () => {
    expect(getStatusBadgeClass('published')).toBe('bg-green-100 border border-green-500 text-primary dark:text-primary-foreground');
  });

  test('returns yellow classes for draft', () => {
    expect(getStatusBadgeClass('draft')).toBe('bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground');
  });
});
