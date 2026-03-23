// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { getCriteriaByCode } from '@/lib/db/criteria';

beforeAll(() => { initDb(':memory:'); });
afterAll(() => { closeDb(); });

describe('getCriteriaByCode', () => {
  it('returns a map of code to id for known WCAG codes', async () => {
    const map = await getCriteriaByCode(['1.1.1', '1.3.1']);
    expect(map.get('1.1.1')).toBeDefined();
    expect(typeof map.get('1.1.1')).toBe('string');
    expect(map.get('1.3.1')).toBeDefined();
  });

  it('returns empty map for empty input', async () => {
    const map = await getCriteriaByCode([]);
    expect(map.size).toBe(0);
  });

  it('omits codes that do not exist in the criteria table', async () => {
    const map = await getCriteriaByCode(['9.9.9', '0.0.0']);
    expect(map.size).toBe(0);
  });

  it('returns partial results when some codes exist and some do not', async () => {
    const map = await getCriteriaByCode(['1.1.1', '9.9.9']);
    expect(map.has('1.1.1')).toBe(true);
    expect(map.has('9.9.9')).toBe(false);
  });
});
