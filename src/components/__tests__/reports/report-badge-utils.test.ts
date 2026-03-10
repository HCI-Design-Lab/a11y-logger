import { getStatusBadgeClass } from '@/components/reports/report-badge-utils';

describe('getStatusBadgeClass', () => {
  test('returns green classes for published', () => {
    expect(getStatusBadgeClass('published')).toBe('bg-green-100 text-green-800 border-green-200');
  });

  test('returns yellow classes for draft', () => {
    expect(getStatusBadgeClass('draft')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200');
  });
});
