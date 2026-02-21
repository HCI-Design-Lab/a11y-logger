import { getTypeBadgeClass, getStatusBadgeClass } from '@/components/reports/report-badge-utils';

describe('getTypeBadgeClass', () => {
  test('returns blue classes for executive', () => {
    expect(getTypeBadgeClass('executive')).toBe('bg-blue-100 text-blue-800 border-blue-200');
  });

  test('returns purple classes for detailed', () => {
    expect(getTypeBadgeClass('detailed')).toBe('bg-purple-100 text-purple-800 border-purple-200');
  });

  test('returns gray classes for custom', () => {
    expect(getTypeBadgeClass('custom')).toBe('bg-gray-100 text-gray-800 border-gray-200');
  });
});

describe('getStatusBadgeClass', () => {
  test('returns green classes for published', () => {
    expect(getStatusBadgeClass('published')).toBe('bg-green-100 text-green-800 border-green-200');
  });

  test('returns yellow classes for draft', () => {
    expect(getStatusBadgeClass('draft')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200');
  });
});
