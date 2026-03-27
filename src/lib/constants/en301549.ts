// src/lib/constants/en301549.ts

/**
 * All EN 301 549 criterion codes seeded into the database.
 * Used to validate criterion_code for EN 301 549 standards.
 */
export const EN301549_CRITERION_NAMES: Record<string, string> = {
  '4.2.1': 'Usage without vision',
  '4.2.2': 'Usage with limited vision',
  '4.2.3': 'Usage without perception of colour',
  '4.2.4': 'Usage without hearing',
  '4.2.5': 'Usage with limited hearing',
  '4.2.6': 'Usage without vocal capability',
  '4.2.7': 'Usage with limited manipulation or strength',
  '4.2.8': 'Usage with limited reach',
  '4.2.9': 'Minimize photosensitive seizure triggers',
  '4.2.10': 'Usage without timed responses',
  '5.2': 'Activation of accessibility features',
  '5.3': 'Biometrics',
  '5.4': 'Preservation of accessibility information during conversion',
  '5.7': 'Key repeat',
  '5.8': 'Double-strike key acceptance',
  '5.9': 'Simultaneous user actions',
  '12.1.1': 'Accessibility and compatibility features',
  '12.1.2': 'Accessible documentation',
  '12.2.2': 'Information on accessibility and compatibility features',
  '12.2.3': 'Effective communication',
  '12.2.4': 'Accessible documentation',
};

export const EN301549_CRITERION_CODES: readonly string[] = [
  // Clause 4: Functional Performance Statements
  '4.2.1',
  '4.2.2',
  '4.2.3',
  '4.2.4',
  '4.2.5',
  '4.2.6',
  '4.2.7',
  '4.2.8',
  '4.2.9',
  '4.2.10',
  // Clause 5: Generic Requirements (5.5–5.6 are hardware-only clauses, omitted)
  '5.2',
  '5.3',
  '5.4',
  '5.7',
  '5.8',
  '5.9',
  // Clause 12: Documentation and Support Services
  '12.1.1',
  '12.1.2',
  '12.2.2',
  '12.2.3',
  '12.2.4',
] as const;
