import type { CreateIssueInput } from '@/lib/validators/issues';
import { ARRAY_FIELDS, ENUM_FIELDS, type ImportableFieldKey } from '@/lib/constants/csv-import';

export interface MapRowsResult {
  issues: CreateIssueInput[];
  warnings: string[];
}

export function mapRows(
  rows: Record<string, string>[],
  mapping: Partial<Record<ImportableFieldKey, string>>
): MapRowsResult {
  const warnings: string[] = [];
  const enumWarned = new Set<string>();

  // Warn about unmapped title
  if (!mapping.title) {
    warnings.push("Title was not mapped — issues will be imported as 'Untitled'");
  }

  const issues: CreateIssueInput[] = rows.map((row) => {
    const issue: Record<string, unknown> = {};

    for (const [fieldKey, csvCol] of Object.entries(mapping) as [ImportableFieldKey, string][]) {
      if (!csvCol) continue;
      const raw = (row[csvCol] ?? '').trim();
      if (!raw) continue;

      if ((ARRAY_FIELDS as readonly string[]).includes(fieldKey)) {
        issue[fieldKey] = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (ENUM_FIELDS[fieldKey]) {
        if (ENUM_FIELDS[fieldKey]!.includes(raw)) {
          issue[fieldKey] = raw;
        } else if (!enumWarned.has(fieldKey)) {
          warnings.push(
            `${fieldKey} contains invalid values (e.g. "${raw}") — those fields were left blank`
          );
          enumWarned.add(fieldKey);
        }
      } else {
        issue[fieldKey] = raw;
      }
    }

    // Ensure title is never empty
    if (!issue.title) {
      issue.title = 'Untitled';
    }

    return issue as CreateIssueInput;
  });

  return { issues, warnings };
}
