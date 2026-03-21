// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module so we can control isPostgres()
vi.mock('../client', () => ({
  isPostgres: vi.fn(),
}));

import { isPostgres } from '../client';
import { jsonArrayContains, nowTimestamp } from '../sql-helpers';

const mockIsPostgres = vi.mocked(isPostgres);

beforeEach(() => {
  vi.clearAllMocks();
});

function sqlToString(expr: unknown): string {
  return JSON.stringify((expr as { queryChunks: unknown }).queryChunks);
}

describe('jsonArrayContains', () => {
  it('returns a SQL expression containing json_each when not PostgreSQL', () => {
    mockIsPostgres.mockReturnValue(false);
    const expr = jsonArrayContains('wcag_codes', '1.1.1');
    expect(sqlToString(expr)).toContain('json_each');
  });

  it('returns a SQL expression containing @> when PostgreSQL', () => {
    mockIsPostgres.mockReturnValue(true);
    const expr = jsonArrayContains('wcag_codes', '1.1.1');
    expect(sqlToString(expr)).toContain('@>');
  });
});

describe('nowTimestamp', () => {
  it("returns datetime('now') expression when not PostgreSQL", () => {
    mockIsPostgres.mockReturnValue(false);
    const expr = nowTimestamp();
    expect(sqlToString(expr)).toContain("datetime('now')");
  });

  it('returns NOW() expression when PostgreSQL', () => {
    mockIsPostgres.mockReturnValue(true);
    const expr = nowTimestamp();
    expect(sqlToString(expr)).toContain('NOW()');
  });
});
