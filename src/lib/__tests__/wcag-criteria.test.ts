import { describe, it, expect } from 'vitest';
import { getWcagCriterionName, getPrincipleFromCode, WCAG_PRINCIPLES } from '../wcag-criteria';

describe('getWcagCriterionName', () => {
  it('returns name for known criterion', () => {
    expect(getWcagCriterionName('1.1.1')).toBe('Non-text Content');
    expect(getWcagCriterionName('1.4.3')).toBe('Contrast (Minimum)');
    expect(getWcagCriterionName('4.1.2')).toBe('Name, Role, Value');
  });

  it('returns undefined for unknown criterion', () => {
    expect(getWcagCriterionName('9.9.9')).toBeUndefined();
  });
});

describe('getPrincipleFromCode', () => {
  it('maps 1.x.x to perceivable', () => {
    expect(getPrincipleFromCode('1.1.1')).toBe('perceivable');
    expect(getPrincipleFromCode('1.4.11')).toBe('perceivable');
  });

  it('maps 2.x.x to operable', () => {
    expect(getPrincipleFromCode('2.1.1')).toBe('operable');
  });

  it('maps 3.x.x to understandable', () => {
    expect(getPrincipleFromCode('3.1.1')).toBe('understandable');
  });

  it('maps 4.x.x to robust', () => {
    expect(getPrincipleFromCode('4.1.2')).toBe('robust');
  });

  it('returns null for unknown code', () => {
    expect(getPrincipleFromCode('9.9.9')).toBeNull();
  });
});

describe('WCAG_PRINCIPLES', () => {
  it('has all four principles', () => {
    expect(WCAG_PRINCIPLES).toEqual(['perceivable', 'operable', 'understandable', 'robust']);
  });
});
