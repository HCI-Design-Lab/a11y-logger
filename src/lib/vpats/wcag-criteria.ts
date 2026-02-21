// WCAG criteria metadata used by VPAT UI components.
// criterion_code values must match those in src/lib/constants/wcag.ts

export const WCAG_CRITERIA = [
  // Perceivable
  { criterion: '1.1.1', name: 'Non-text Content', level: 'A', principle: 'Perceivable' },
  {
    criterion: '1.2.1',
    name: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
  },
  { criterion: '1.2.2', name: 'Captions (Prerecorded)', level: 'A', principle: 'Perceivable' },
  { criterion: '1.3.1', name: 'Info and Relationships', level: 'A', principle: 'Perceivable' },
  { criterion: '1.3.2', name: 'Meaningful Sequence', level: 'A', principle: 'Perceivable' },
  { criterion: '1.4.1', name: 'Use of Color', level: 'A', principle: 'Perceivable' },
  { criterion: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', principle: 'Perceivable' },
  { criterion: '1.4.4', name: 'Resize Text', level: 'AA', principle: 'Perceivable' },
  { criterion: '1.4.11', name: 'Non-text Contrast', level: 'AA', principle: 'Perceivable' },
  // Operable
  { criterion: '2.1.1', name: 'Keyboard', level: 'A', principle: 'Operable' },
  { criterion: '2.1.2', name: 'No Keyboard Trap', level: 'A', principle: 'Operable' },
  { criterion: '2.2.2', name: 'Pause, Stop, Hide', level: 'A', principle: 'Operable' },
  { criterion: '2.4.1', name: 'Bypass Blocks', level: 'A', principle: 'Operable' },
  { criterion: '2.4.3', name: 'Focus Order', level: 'A', principle: 'Operable' },
  { criterion: '2.4.7', name: 'Focus Visible', level: 'AA', principle: 'Operable' },
  { criterion: '2.5.3', name: 'Label in Name', level: 'A', principle: 'Operable' },
  // Understandable
  { criterion: '3.1.1', name: 'Language of Page', level: 'A', principle: 'Understandable' },
  { criterion: '3.2.1', name: 'On Focus', level: 'A', principle: 'Understandable' },
  { criterion: '3.3.1', name: 'Error Identification', level: 'A', principle: 'Understandable' },
  { criterion: '3.3.2', name: 'Labels or Instructions', level: 'A', principle: 'Understandable' },
  { criterion: '3.3.3', name: 'Error Suggestion', level: 'AA', principle: 'Understandable' },
  // Robust
  { criterion: '4.1.2', name: 'Name, Role, Value', level: 'A', principle: 'Robust' },
  { criterion: '4.1.3', name: 'Status Messages', level: 'AA', principle: 'Robust' },
] as const;

export const CONFORMANCE_OPTIONS = [
  'Supports',
  'Partially Supports',
  'Does Not Support',
  'Not Applicable',
  'Not Evaluated',
] as const;

export type ConformanceLevel = (typeof CONFORMANCE_OPTIONS)[number];

type DbConformance =
  | 'supports'
  | 'partially_supports'
  | 'does_not_support'
  | 'not_applicable'
  | 'not_evaluated';

// Map from DB snake_case conformance values to display labels
export const CONFORMANCE_DISPLAY: Record<DbConformance, string> = {
  supports: 'Supports',
  partially_supports: 'Partially Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
  not_evaluated: 'Not Evaluated',
};

// Map from display labels to DB snake_case values
export const CONFORMANCE_DB_VALUE: Record<string, DbConformance> = {
  Supports: 'supports',
  'Partially Supports': 'partially_supports',
  'Does Not Support': 'does_not_support',
  'Not Applicable': 'not_applicable',
  'Not Evaluated': 'not_evaluated',
};

/** Build default criteria_rows for all WCAG criteria, all set to not_evaluated. */
export function buildDefaultCriteriaRows() {
  return WCAG_CRITERIA.map((c) => ({
    criterion_code: c.criterion,
    conformance: 'not_evaluated' as const,
    remarks: '',
    related_issue_ids: [] as string[],
  }));
}
