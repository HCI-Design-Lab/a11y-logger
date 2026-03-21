import { describe, it, expect } from 'vitest';
import { getWcagCriterionName, getPrincipleFromCode, WCAG_PRINCIPLES } from '../wcag-criteria';

// Complete list of WCAG 2.2 success criteria (A, AA, and AAA)
const ALL_WCAG_22_CRITERIA: Record<string, string> = {
  // 1.1 Text Alternatives
  '1.1.1': 'Non-text Content',
  // 1.2 Time-based Media
  '1.2.1': 'Audio-only and Video-only (Prerecorded)',
  '1.2.2': 'Captions (Prerecorded)',
  '1.2.3': 'Audio Description or Media Alternative',
  '1.2.4': 'Captions (Live)',
  '1.2.5': 'Audio Description (Prerecorded)',
  '1.2.6': 'Sign Language (Prerecorded)',
  '1.2.7': 'Extended Audio Description (Prerecorded)',
  '1.2.8': 'Media Alternative (Prerecorded)',
  '1.2.9': 'Audio-only (Live)',
  // 1.3 Adaptable
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.3.3': 'Sensory Characteristics',
  '1.3.4': 'Orientation',
  '1.3.5': 'Identify Input Purpose',
  '1.3.6': 'Identify Purpose',
  // 1.4 Distinguishable
  '1.4.1': 'Use of Color',
  '1.4.2': 'Audio Control',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize Text',
  '1.4.5': 'Images of Text',
  '1.4.6': 'Contrast (Enhanced)',
  '1.4.7': 'Low or No Background Audio',
  '1.4.8': 'Visual Presentation',
  '1.4.9': 'Images of Text (No Exception)',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text Contrast',
  '1.4.12': 'Text Spacing',
  '1.4.13': 'Content on Hover or Focus',
  // 2.1 Keyboard Accessible
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.1.3': 'Keyboard (No Exception)',
  '2.1.4': 'Character Key Shortcuts',
  // 2.2 Enough Time
  '2.2.1': 'Timing Adjustable',
  '2.2.2': 'Pause, Stop, Hide',
  '2.2.3': 'No Timing',
  '2.2.4': 'Interruptions',
  '2.2.5': 'Re-authenticating',
  '2.2.6': 'Timeouts',
  // 2.3 Seizures and Physical Reactions
  '2.3.1': 'Three Flashes or Below Threshold',
  '2.3.2': 'Three Flashes',
  '2.3.3': 'Animation from Interactions',
  // 2.4 Navigable
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order',
  '2.4.4': 'Link Purpose (In Context)',
  '2.4.5': 'Multiple Ways',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '2.4.8': 'Location',
  '2.4.9': 'Link Purpose (Link Only)',
  '2.4.10': 'Section Headings',
  '2.4.11': 'Focus Appearance (Minimum)',
  '2.4.13': 'Focus Appearance',
  // 2.5 Input Modalities
  '2.5.1': 'Pointer Gestures',
  '2.5.2': 'Pointer Cancellation',
  '2.5.3': 'Label in Name',
  '2.5.4': 'Motion Actuation',
  '2.5.5': 'Target Size (Enhanced)',
  '2.5.6': 'Concurrent Input Mechanisms',
  '2.5.7': 'Dragging Movements',
  '2.5.8': 'Target Size (Minimum)',
  // 3.1 Readable
  '3.1.1': 'Language of Page',
  '3.1.2': 'Language of Parts',
  '3.1.3': 'Unusual Words',
  '3.1.4': 'Abbreviations',
  '3.1.5': 'Reading Level',
  '3.1.6': 'Pronunciation',
  // 3.2 Predictable
  '3.2.1': 'On Focus',
  '3.2.2': 'On Input',
  '3.2.3': 'Consistent Navigation',
  '3.2.4': 'Consistent Identification',
  '3.2.5': 'Change on Request',
  '3.2.6': 'Consistent Help',
  // 3.3 Input Assistance
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '3.3.3': 'Error Suggestion',
  '3.3.4': 'Error Prevention (Legal, Financial, Data)',
  '3.3.5': 'Help',
  '3.3.6': 'Error Prevention (All)',
  '3.3.7': 'Redundant Entry',
  '3.3.8': 'Accessible Authentication (Minimum)',
  '3.3.9': 'Accessible Authentication (Enhanced)',
  // 4.1 Compatible
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, Role, Value',
  '4.1.3': 'Status Messages',
};

describe('getWcagCriterionName', () => {
  it('returns name for known criterion', () => {
    expect(getWcagCriterionName('1.1.1')).toBe('Non-text Content');
    expect(getWcagCriterionName('1.4.3')).toBe('Contrast (Minimum)');
    expect(getWcagCriterionName('4.1.2')).toBe('Name, Role, Value');
  });

  it('returns undefined for unknown criterion', () => {
    expect(getWcagCriterionName('9.9.9')).toBeUndefined();
  });

  it('returns name for 1.3.6 Identify Purpose', () => {
    expect(getWcagCriterionName('1.3.6')).toBe('Identify Purpose');
  });

  it('returns name for 2.4.8 Location', () => {
    expect(getWcagCriterionName('2.4.8')).toBe('Location');
  });

  it('has names for all WCAG 2.2 success criteria', () => {
    const missing: string[] = [];
    for (const [code, expectedName] of Object.entries(ALL_WCAG_22_CRITERIA)) {
      const actual = getWcagCriterionName(code);
      if (actual !== expectedName) {
        missing.push(`${code}: expected "${expectedName}", got ${JSON.stringify(actual)}`);
      }
    }
    expect(missing).toEqual([]);
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
