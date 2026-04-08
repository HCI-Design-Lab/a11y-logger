// src/lib/vpat-tabs.ts

/** Display labels for each criterion section key used in VPAT tabs. */
export const SECTION_TAB_LABELS: Record<string, string> = {
  // WCAG levels
  A: 'Level A',
  AA: 'Level AA',
  AAA: 'Level AAA',
  // Section 508 chapters
  Chapter3: 'FPC',
  Chapter4: 'Hardware',
  Chapter5: 'Software',
  Chapter6: 'Documentation',
  // EN 301 549 clauses
  Clause4: 'Clause 4',
  Clause5: 'Clause 5',
  Clause6: 'Clause 6',
  Clause7: 'Clause 7',
  Clause8: 'Clause 8',
  Clause10: 'Clause 10',
  Clause11: 'Clause 11',
  Clause12: 'Clause 12',
  Clause13: 'Clause 13',
};

/** Ordered section keys for each VPAT edition — defines tab order. */
export const EDITION_SECTION_KEYS: Record<string, string[]> = {
  WCAG: ['A', 'AA', 'AAA'],
  '508': ['A', 'AA', 'AAA', 'Chapter3', 'Chapter4', 'Chapter5', 'Chapter6'],
  EU: [
    'Clause4',
    'Clause5',
    'Clause6',
    'Clause7',
    'Clause8',
    'Clause10',
    'Clause11',
    'Clause12',
    'Clause13',
  ],
  INT: [
    'A',
    'AA',
    'AAA',
    'Chapter3',
    'Chapter4',
    'Chapter5',
    'Chapter6',
    'Clause4',
    'Clause5',
    'Clause6',
    'Clause7',
    'Clause8',
    'Clause10',
    'Clause11',
    'Clause12',
    'Clause13',
  ],
};
