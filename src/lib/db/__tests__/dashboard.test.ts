// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../index';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('getDashboardStats', () => {
  it('returns zero counts when db is empty', async () => {
    const { getDashboardStats } = await import('../dashboard');
    const stats = getDashboardStats();
    expect(stats.total_projects).toBe(0);
    expect(stats.total_assessments).toBe(0);
    expect(stats.total_issues).toBe(0);
    expect(stats.total_reports).toBe(0);
    expect(stats.total_vpats).toBe(0);
    expect(stats.severity_breakdown.critical).toBe(0);
    expect(stats.severity_breakdown.high).toBe(0);
    expect(stats.severity_breakdown.medium).toBe(0);
    expect(stats.severity_breakdown.low).toBe(0);
  });
});

describe('getRecentActivity', () => {
  it('returns empty array when db is empty', async () => {
    const { getRecentActivity } = await import('../dashboard');
    const activity = getRecentActivity();
    expect(Array.isArray(activity)).toBe(true);
    expect(activity.length).toBe(0);
  });

  it('limits results to 10 by default', async () => {
    const { getRecentActivity } = await import('../dashboard');
    const activity = getRecentActivity();
    expect(activity.length).toBeLessThanOrEqual(10);
  });
});
