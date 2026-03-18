// src/lib/constants/section508.ts

/**
 * All Section 508 criterion codes seeded into the database.
 * Used to validate criterion_code for Section 508 standards.
 */
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
