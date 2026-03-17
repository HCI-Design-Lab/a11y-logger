// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { GET } from '../route';

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('GET /api/criteria', () => {
  it('returns criteria sections for WCAG edition', async () => {
    const res = await GET(
      new Request(
        'http://localhost/api/criteria?edition=WCAG&wcag_version=2.1&wcag_level=AA&product_scope=web'
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.sections).toBeDefined();
    expect(body.data.sections.length).toBeGreaterThan(0);
    expect(typeof body.data.total).toBe('number');
    expect(body.data.total).toBeGreaterThan(0);
  });

  it('excludes 2.1-only criteria for 508 edition', async () => {
    const res = await GET(
      new Request('http://localhost/api/criteria?edition=508&product_scope=web')
    );
    const body = await res.json();
    const allCodes = body.data.sections.flatMap((s: { criteria: { code: string }[] }) =>
      s.criteria.map((c: { code: string }) => c.code)
    );
    expect(allCodes).not.toContain('1.3.4');
  });

  it('returns 400 for missing edition', async () => {
    const res = await GET(new Request('http://localhost/api/criteria'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid edition', async () => {
    const res = await GET(new Request('http://localhost/api/criteria?edition=INVALID'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid wcag_version', async () => {
    const res = await GET(
      new Request('http://localhost/api/criteria?edition=WCAG&wcag_version=9.9')
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
