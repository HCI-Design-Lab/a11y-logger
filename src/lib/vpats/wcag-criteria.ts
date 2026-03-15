// WCAG criteria metadata used by VPAT UI components.
// criterion_code values must match those in src/lib/constants/wcag.ts

export type WcagVersion = '2.0' | '2.1' | '2.2';
export type ConformanceLevel = 'A' | 'AA' | 'AAA';
export type WcagPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

export interface WcagCriterion {
  criterion: string;
  name: string;
  level: ConformanceLevel;
  principle: WcagPrinciple;
  wcag_version: WcagVersion;
}

export const WCAG_CRITERIA: readonly WcagCriterion[] = [
  // ── Perceivable ──────────────────────────────────────────────────────────
  {
    criterion: '1.1.1',
    name: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.1',
    name: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.2',
    name: 'Captions (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.3',
    name: 'Audio Description or Media Alternative (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.4',
    name: 'Captions (Live)',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.5',
    name: 'Audio Description (Prerecorded)',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.6',
    name: 'Sign Language (Prerecorded)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.7',
    name: 'Extended Audio Description (Prerecorded)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.8',
    name: 'Media Alternative (Prerecorded)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.2.9',
    name: 'Audio-only (Live)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.3.1',
    name: 'Info and Relationships',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.3.2',
    name: 'Meaningful Sequence',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.3.3',
    name: 'Sensory Characteristics',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.3.4',
    name: 'Orientation',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.3.5',
    name: 'Identify Input Purpose',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.3.6',
    name: 'Identify Purpose',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.4.1',
    name: 'Use of Color',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.2',
    name: 'Audio Control',
    level: 'A',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.3',
    name: 'Contrast (Minimum)',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.4',
    name: 'Resize Text',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.5',
    name: 'Images of Text',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.6',
    name: 'Contrast (Enhanced)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.7',
    name: 'Low or No Background Audio',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.8',
    name: 'Visual Presentation',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.9',
    name: 'Images of Text (No Exception)',
    level: 'AAA',
    principle: 'Perceivable',
    wcag_version: '2.0',
  },
  {
    criterion: '1.4.10',
    name: 'Reflow',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.4.11',
    name: 'Non-text Contrast',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.4.12',
    name: 'Text Spacing',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  {
    criterion: '1.4.13',
    name: 'Content on Hover or Focus',
    level: 'AA',
    principle: 'Perceivable',
    wcag_version: '2.1',
  },
  // ── Operable ─────────────────────────────────────────────────────────────
  { criterion: '2.1.1', name: 'Keyboard', level: 'A', principle: 'Operable', wcag_version: '2.0' },
  {
    criterion: '2.1.2',
    name: 'No Keyboard Trap',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.1.3',
    name: 'Keyboard (No Exception)',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.1.4',
    name: 'Character Key Shortcuts',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.2.1',
    name: 'Timing Adjustable',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.2.2',
    name: 'Pause, Stop, Hide',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.2.3',
    name: 'No Timing',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.2.4',
    name: 'Interruptions',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.2.5',
    name: 'Re-authenticating',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.2.6',
    name: 'Timeouts',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.3.1',
    name: 'Three Flashes or Below Threshold',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.3.2',
    name: 'Three Flashes',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.3.3',
    name: 'Animation from Interactions',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.4.1',
    name: 'Bypass Blocks',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.2',
    name: 'Page Titled',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.3',
    name: 'Focus Order',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.4',
    name: 'Link Purpose (In Context)',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.5',
    name: 'Multiple Ways',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.6',
    name: 'Headings and Labels',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.7',
    name: 'Focus Visible',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.8',
    name: 'Location',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.9',
    name: 'Link Purpose (Link Only)',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.10',
    name: 'Section Headings',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.0',
  },
  {
    criterion: '2.4.11',
    name: 'Focus Not Obscured (Minimum)',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.2',
  },
  {
    criterion: '2.4.12',
    name: 'Focus Not Obscured (Enhanced)',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.2',
  },
  {
    criterion: '2.4.13',
    name: 'Focus Appearance',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.2',
  },
  {
    criterion: '2.5.1',
    name: 'Pointer Gestures',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.2',
    name: 'Pointer Cancellation',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.3',
    name: 'Label in Name',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.4',
    name: 'Motion Actuation',
    level: 'A',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.5',
    name: 'Target Size (Enhanced)',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.6',
    name: 'Concurrent Input Mechanisms',
    level: 'AAA',
    principle: 'Operable',
    wcag_version: '2.1',
  },
  {
    criterion: '2.5.7',
    name: 'Dragging Movements',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.2',
  },
  {
    criterion: '2.5.8',
    name: 'Target Size (Minimum)',
    level: 'AA',
    principle: 'Operable',
    wcag_version: '2.2',
  },
  // ── Understandable ───────────────────────────────────────────────────────
  {
    criterion: '3.1.1',
    name: 'Language of Page',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.1.2',
    name: 'Language of Parts',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.1.3',
    name: 'Unusual Words',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.1.4',
    name: 'Abbreviations',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.1.5',
    name: 'Reading Level',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.1.6',
    name: 'Pronunciation',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.1',
    name: 'On Focus',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.2',
    name: 'On Input',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.3',
    name: 'Consistent Navigation',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.4',
    name: 'Consistent Identification',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.5',
    name: 'Change on Request',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.2.6',
    name: 'Consistent Help',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.2',
  },
  {
    criterion: '3.3.1',
    name: 'Error Identification',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.2',
    name: 'Labels or Instructions',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.3',
    name: 'Error Suggestion',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.4',
    name: 'Error Prevention (Legal, Financial, Data)',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.5',
    name: 'Help',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.6',
    name: 'Error Prevention (All)',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.0',
  },
  {
    criterion: '3.3.7',
    name: 'Redundant Entry',
    level: 'A',
    principle: 'Understandable',
    wcag_version: '2.2',
  },
  {
    criterion: '3.3.8',
    name: 'Accessible Authentication (Minimum)',
    level: 'AA',
    principle: 'Understandable',
    wcag_version: '2.2',
  },
  {
    criterion: '3.3.9',
    name: 'Accessible Authentication (Enhanced)',
    level: 'AAA',
    principle: 'Understandable',
    wcag_version: '2.2',
  },
  // ── Robust ────────────────────────────────────────────────────────────────
  { criterion: '4.1.1', name: 'Parsing', level: 'A', principle: 'Robust', wcag_version: '2.0' },
  {
    criterion: '4.1.2',
    name: 'Name, Role, Value',
    level: 'A',
    principle: 'Robust',
    wcag_version: '2.0',
  },
  {
    criterion: '4.1.3',
    name: 'Status Messages',
    level: 'AA',
    principle: 'Robust',
    wcag_version: '2.1',
  },
] as const;

export const CONFORMANCE_OPTIONS = [
  'Supports',
  'Partially Supports',
  'Does Not Support',
  'Not Applicable',
  'Not Evaluated',
] as const;

export type DbConformance =
  | 'supports'
  | 'partially_supports'
  | 'does_not_support'
  | 'not_applicable'
  | 'not_evaluated';

export const CONFORMANCE_DISPLAY: Record<DbConformance, string> = {
  supports: 'Supports',
  partially_supports: 'Partially Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
  not_evaluated: 'Not Evaluated',
};

export const CONFORMANCE_DB_VALUE: Record<string, DbConformance> = {
  Supports: 'supports',
  'Partially Supports': 'partially_supports',
  'Does Not Support': 'does_not_support',
  'Not Applicable': 'not_applicable',
  'Not Evaluated': 'not_evaluated',
};

const VERSION_ORDER: Record<WcagVersion, number> = { '2.0': 0, '2.1': 1, '2.2': 2 };
const LEVEL_ORDER: Record<ConformanceLevel, number> = { A: 0, AA: 1, AAA: 2 };

/**
 * Returns all criteria for a given WCAG version + max conformance level.
 * e.g. getCriteriaForScope('2.1', 'AA') returns all A and AA criteria in WCAG 2.0 and 2.1.
 */
export function getCriteriaForScope(
  version: '2.1' | '2.2',
  level: 'A' | 'AA' | 'AAA'
): readonly WcagCriterion[] {
  return WCAG_CRITERIA.filter(
    (c) =>
      VERSION_ORDER[c.wcag_version] <= VERSION_ORDER[version] &&
      LEVEL_ORDER[c.level] <= LEVEL_ORDER[level]
  );
}

/** Build default criteria_rows for the given scope, all set to not_evaluated. */
export function buildDefaultCriteriaRows(
  version: '2.1' | '2.2' = '2.1',
  level: 'A' | 'AA' | 'AAA' = 'AA'
) {
  return getCriteriaForScope(version, level).map((c) => ({
    criterion_code: c.criterion,
    conformance: 'not_evaluated' as const,
    remarks: '',
    related_issue_ids: [] as string[],
  }));
}
