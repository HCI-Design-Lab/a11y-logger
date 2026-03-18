import { describe, it, expect } from 'vitest';
import { SECTION_508_CRITERION_CODES } from '@/lib/constants/section508';
import { EN301549_CRITERION_CODES } from '@/lib/constants/en301549';

describe('SECTION_508_CRITERION_CODES', () => {
  it('contains all expected Section 508 codes', () => {
    expect(SECTION_508_CRITERION_CODES).toContain('302.1');
    expect(SECTION_508_CRITERION_CODES).toContain('302.9');
    expect(SECTION_508_CRITERION_CODES).toContain('502.2.1');
    expect(SECTION_508_CRITERION_CODES).toContain('502.3.3');
    expect(SECTION_508_CRITERION_CODES).toContain('602.2');
    expect(SECTION_508_CRITERION_CODES).toContain('603.2');
  });

  it('has 18 codes total', () => {
    expect(SECTION_508_CRITERION_CODES).toHaveLength(18);
  });
});

describe('EN301549_CRITERION_CODES', () => {
  it('contains all expected EN 301 549 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('4.2.1');
    expect(EN301549_CRITERION_CODES).toContain('4.2.10');
    expect(EN301549_CRITERION_CODES).toContain('5.2');
    expect(EN301549_CRITERION_CODES).toContain('5.9');
    expect(EN301549_CRITERION_CODES).toContain('12.1.1');
    expect(EN301549_CRITERION_CODES).toContain('12.2.4');
  });

  it('has 21 codes total', () => {
    expect(EN301549_CRITERION_CODES).toHaveLength(21);
  });
});
