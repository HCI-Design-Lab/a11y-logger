// src/lib/constants/section508.ts

/**
 * All Section 508 criterion codes seeded into the database.
 * Used to validate criterion_code for Section 508 standards.
 */
export const SECTION_508_CRITERION_NAMES: Record<string, string> = {
  '302.1': 'Without Vision',
  '302.2': 'With Limited Vision',
  '302.3': 'Without Perception of Color',
  '302.4': 'Without Hearing',
  '302.5': 'With Limited Hearing',
  '302.6': 'Without Speech',
  '302.7': 'With Limited Manipulation',
  '302.8': 'With Limited Reach and Strength',
  '302.9': 'With Limited Language, Cognitive, and Learning Abilities',
  '502.2.1': 'User Control of Accessibility Features',
  '502.2.2': 'No Disruption of Accessibility Features',
  '502.3.1': 'Object Information',
  '502.3.2': 'Modification of Object Information',
  '502.3.3': 'Row, Column, and Headers',
  '602.2': 'Accessibility and Compatibility Features',
  '602.3': 'Electronic Support Documentation',
  '602.4': 'Alternate Formats',
  '603.2': 'Information Services',
};

export const SECTION_508_CRITERION_CODES: readonly string[] = [
  // Chapter 3: Functional Performance Criteria
  '302.1',
  '302.2',
  '302.3',
  '302.4',
  '302.5',
  '302.6',
  '302.7',
  '302.8',
  '302.9',
  // Chapter 5: Software
  '502.2.1',
  '502.2.2',
  '502.3.1',
  '502.3.2',
  '502.3.3',
  // Chapter 6: Support Documentation and Services
  '602.2',
  '602.3',
  '602.4',
  '603.2',
] as const;
