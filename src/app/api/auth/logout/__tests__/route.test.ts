import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  destroySession: vi.fn().mockResolvedValue(undefined),
}));

import { destroySession } from '@/lib/auth/session';
import { POST } from '../route';

describe('POST /api/auth/logout', () => {
  it('calls destroySession', async () => {
    await POST();
    expect(destroySession).toHaveBeenCalled();
  });

  it('returns success', async () => {
    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
