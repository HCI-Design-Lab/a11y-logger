import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../reset/route';

const mockRun = vi.fn();
const mockPrepare = vi.fn((_sql: string) => ({ run: mockRun }));
const mockTransaction = vi.fn((fn: () => void) => () => fn());

vi.mock('@/lib/db/index', () => ({
  initDbSync: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(() => ({
    prepare: mockPrepare,
    transaction: mockTransaction,
  })),
}));

describe('POST /api/settings/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockReset();
    mockPrepare.mockReturnValue({ run: mockRun });
    mockTransaction.mockImplementation((fn: () => void) => () => fn());
  });

  it('returns 200 with success on reset', async () => {
    const res = await POST();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('deletes all user data tables in a transaction', async () => {
    await POST();
    expect(mockTransaction).toHaveBeenCalledOnce();
    const deletedTables = mockPrepare.mock.calls.map((c) =>
      (c[0] as unknown as string).replace('DELETE FROM ', '')
    );
    expect(deletedTables).toContain('vpat_snapshots');
    expect(deletedTables).toContain('vpat_criterion_rows');
    expect(deletedTables).toContain('vpats');
    expect(deletedTables).toContain('issues');
    expect(deletedTables).toContain('reports');
    expect(deletedTables).toContain('assessments');
    expect(deletedTables).toContain('projects');
  });

  it('does not delete settings, criteria, users, or migrations', async () => {
    await POST();
    const deletedTables = mockPrepare.mock.calls.map((c) =>
      (c[0] as unknown as string).replace('DELETE FROM ', '')
    );
    expect(deletedTables).not.toContain('settings');
    expect(deletedTables).not.toContain('criteria');
    expect(deletedTables).not.toContain('users');
    expect(deletedTables).not.toContain('_migrations');
  });

  it('returns 500 when DB throws', async () => {
    mockTransaction.mockImplementation(() => () => {
      throw new Error('DB error');
    });
    const res = await POST();
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
