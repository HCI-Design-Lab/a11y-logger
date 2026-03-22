export const IMPORTABLE_ISSUE_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'URL' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'wcag_codes', label: 'WCAG Codes (comma-separated)' },
  { key: 'section_508_codes', label: 'Section 508 Codes (comma-separated)' },
  { key: 'eu_codes', label: 'EU Codes (comma-separated)' },
  { key: 'device_type', label: 'Device Type' },
  { key: 'browser', label: 'Browser' },
  { key: 'operating_system', label: 'Operating System' },
  { key: 'assistive_technology', label: 'Assistive Technology' },
  { key: 'user_impact', label: 'User Impact' },
  { key: 'selector', label: 'Selector' },
  { key: 'code_snippet', label: 'Code Snippet' },
  { key: 'suggested_fix', label: 'Suggested Fix' },
  { key: 'tags', label: 'Tags (comma-separated)' },
] as const;

export type ImportableFieldKey = (typeof IMPORTABLE_ISSUE_FIELDS)[number]['key'];

/** Fields whose CSV values are comma-separated strings that become string arrays */
export const ARRAY_FIELDS: ImportableFieldKey[] = [
  'wcag_codes',
  'section_508_codes',
  'eu_codes',
  'tags',
];

/** Valid enum values per field — used to filter out invalid CSV values */
export const ENUM_FIELDS: Partial<Record<ImportableFieldKey, string[]>> = {
  severity: ['critical', 'high', 'medium', 'low'],
  status: ['open', 'resolved', 'wont_fix'],
  device_type: ['desktop', 'mobile', 'tablet'],
};
