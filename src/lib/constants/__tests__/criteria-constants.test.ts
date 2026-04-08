import { describe, it, expect } from 'vitest';
import { SECTION_508_CRITERION_CODES, SECTION_508_CRITERION_NAMES } from '../section508';
import { EN301549_CRITERION_CODES, EN301549_CRITERION_NAMES } from '../en301549';

describe('Section 508 constants', () => {
  it('includes Chapter 4 hardware codes', () => {
    expect(SECTION_508_CRITERION_CODES).toContain('402.1');
    expect(SECTION_508_CRITERION_CODES).toContain('407.6');
    expect(SECTION_508_CRITERION_CODES).toContain('415.1.2');
    expect(SECTION_508_CRITERION_NAMES['402.1']).toBe('General (Closed Functionality)');
  });
});

describe('EN 301 549 constants', () => {
  it('includes Clause 6 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('6.1');
    expect(EN301549_CRITERION_NAMES['6.1']).toBeTruthy();
  });
  it('includes Clause 7 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('7.1.1');
    expect(EN301549_CRITERION_NAMES['7.1.1']).toBeTruthy();
  });
  it('includes Clause 8 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('8.1.1');
    expect(EN301549_CRITERION_NAMES['8.1.1']).toBeTruthy();
  });
  it('includes Clause 10 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('10.1.1.1');
    expect(EN301549_CRITERION_NAMES['10.1.1.1']).toBeTruthy();
  });
  it('includes Clause 11 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('11.1.1.1.1');
    expect(EN301549_CRITERION_NAMES['11.1.1.1.1']).toBeTruthy();
  });
  it('includes Clause 13 codes', () => {
    expect(EN301549_CRITERION_CODES).toContain('13.1.2');
    expect(EN301549_CRITERION_NAMES['13.1.2']).toBeTruthy();
  });
});
