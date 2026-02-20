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

describe('getDashboardStats with data', () => {
  it('counts projects correctly', async () => {
    const { getDashboardStats } = await import('../dashboard');
    const { createProject } = await import('../projects');
    createProject({ name: 'Project A', description: null, product_url: null, status: 'active' });
    createProject({ name: 'Project B', description: null, product_url: null, status: 'active' });
    const stats = getDashboardStats();
    expect(stats.total_projects).toBe(2);
  });

  it('counts severity breakdown correctly', async () => {
    const { getDashboardStats } = await import('../dashboard');
    const { createProject } = await import('../projects');
    const { createAssessment } = await import('../assessments');
    const { createIssue } = await import('../issues');

    const project = createProject({
      name: 'Test Project',
      description: null,
      product_url: null,
      status: 'active',
    });
    const assessment = createAssessment(project.id, {
      name: 'Test Assessment',
      description: null,
      status: 'planning',
    });

    createIssue(assessment.id, { title: 'Critical Issue', severity: 'critical', status: 'open' });
    createIssue(assessment.id, { title: 'High Issue', severity: 'high', status: 'open' });
    createIssue(assessment.id, { title: 'Medium Issue', severity: 'medium', status: 'open' });
    createIssue(assessment.id, { title: 'Low Issue', severity: 'low', status: 'open' });

    const stats = getDashboardStats();
    expect(stats.severity_breakdown.critical).toBeGreaterThanOrEqual(1);
    expect(stats.severity_breakdown.high).toBeGreaterThanOrEqual(1);
    expect(stats.severity_breakdown.medium).toBeGreaterThanOrEqual(1);
    expect(stats.severity_breakdown.low).toBeGreaterThanOrEqual(1);
    expect(stats.total_issues).toBeGreaterThanOrEqual(4);
  });
});

describe('getRecentActivity with data', () => {
  it('returns projects in the activity feed', async () => {
    const { getRecentActivity } = await import('../dashboard');
    const { createProject } = await import('../projects');
    createProject({
      name: 'Active Project',
      description: null,
      product_url: null,
      status: 'active',
    });
    const activity = getRecentActivity();
    expect(activity.length).toBeGreaterThan(0);
    const projectItem = activity.find((item) => item.title === 'Active Project');
    expect(projectItem).toBeDefined();
    expect(projectItem?.type).toBe('project');
  });

  it('limits results to specified count', async () => {
    const { getRecentActivity } = await import('../dashboard');
    const { createProject } = await import('../projects');
    for (let i = 0; i < 15; i++) {
      createProject({
        name: `Limit Project ${i}`,
        description: null,
        product_url: null,
        status: 'active',
      });
    }
    const activity = getRecentActivity(5);
    expect(activity.length).toBeLessThanOrEqual(5);
  });
});
