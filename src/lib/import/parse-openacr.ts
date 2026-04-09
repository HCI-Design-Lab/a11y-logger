export type ConformanceLevel =
  | 'supports'
  | 'partially_supports'
  | 'does_not_support'
  | 'not_applicable'
  | 'not_evaluated';

export interface OpenAcrParsedComponent {
  component_name: string;
  conformance: ConformanceLevel;
  remarks: string | null;
}

export interface OpenAcrParseResult {
  title: string;
  description: string | null;
  standard_edition: 'WCAG' | '508' | 'EU' | 'INT';
  wcag_version: '2.1' | '2.2';
  wcag_level: 'A' | 'AA' | 'AAA';
  criteria: Array<{
    code: string;
    conformance: ConformanceLevel;
    remarks: string | null;
    components: OpenAcrParsedComponent[];
  }>;
}

const CATALOG_MAP: Record<
  string,
  { standard_edition: 'WCAG' | '508' | 'EU' | 'INT'; wcag_version: '2.1' | '2.2' }
> = {
  '2.4-edition-wcag-2.1-en': { standard_edition: 'WCAG', wcag_version: '2.1' },
  '2.5-edition-wcag-2.2-en': { standard_edition: 'WCAG', wcag_version: '2.2' },
  '2.4-edition-wcag-2.2-en': { standard_edition: 'WCAG', wcag_version: '2.2' },
  '2.4-edition-508-en': { standard_edition: '508', wcag_version: '2.1' },
  '2.5-edition-wcag-2.2-508-en': { standard_edition: '508', wcag_version: '2.2' },
  '2.4-edition-en301549-en': { standard_edition: 'EU', wcag_version: '2.1' },
  '2.5-edition-wcag-2.2-en301549-en': { standard_edition: 'EU', wcag_version: '2.2' },
};

const CONFORMANCE_MAP: Record<string, ConformanceLevel> = {
  supports: 'supports',
  'partially-supports': 'partially_supports',
  'does-not-support': 'does_not_support',
  'not-applicable': 'not_applicable',
  'not-evaluated': 'not_evaluated',
};

export function parseCatalog(
  catalogId: string
): { standard_edition: 'WCAG' | '508' | 'EU' | 'INT'; wcag_version: '2.1' | '2.2' } | null {
  return CATALOG_MAP[catalogId] ?? null;
}

export function inferWcagLevel(chapters: Record<string, unknown>): 'A' | 'AA' | 'AAA' {
  if ('success_criteria_level_aaa' in chapters) return 'AAA';
  if ('success_criteria_level_aa' in chapters) return 'AA';
  return 'A';
}

export function mapConformance(level: string): ConformanceLevel {
  return CONFORMANCE_MAP[level] ?? 'not_evaluated';
}

export function extractCriteria(chapters: Record<string, unknown>): Array<{
  code: string;
  conformance: ConformanceLevel;
  remarks: string | null;
  components: OpenAcrParsedComponent[];
}> {
  const result: Array<{
    code: string;
    conformance: ConformanceLevel;
    remarks: string | null;
    components: OpenAcrParsedComponent[];
  }> = [];
  const levelKeys = [
    'success_criteria_level_a',
    'success_criteria_level_aa',
    'success_criteria_level_aaa',
  ];

  for (const key of levelKeys) {
    const chapter = chapters[key] as { criteria?: unknown[] } | undefined;
    if (!chapter?.criteria) continue;

    for (const entry of chapter.criteria) {
      const c = entry as {
        num: string;
        components?: Array<{ name?: string; adherence?: { level?: string; notes?: string } }>;
      };
      const rawComponents = c.components ?? [];
      const firstAdherence = rawComponents[0]?.adherence;
      const firstNotes = firstAdherence?.notes ?? '';

      const components: OpenAcrParsedComponent[] = rawComponents.map((comp) => {
        const notes = comp.adherence?.notes ?? '';
        return {
          component_name: comp.name ?? 'web',
          conformance: mapConformance(comp.adherence?.level ?? 'not-evaluated'),
          remarks: notes.trim() ? notes : null,
        };
      });

      result.push({
        code: c.num,
        conformance: mapConformance(firstAdherence?.level ?? 'not-evaluated'),
        remarks: firstNotes.trim() ? firstNotes : null,
        components,
      });
    }
  }

  return result;
}

export function parseOpenAcr(raw: unknown): OpenAcrParseResult | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const doc = raw as Record<string, unknown>;
  if (!doc.catalog || !doc.chapters) return null;

  const catalogInfo = parseCatalog(doc.catalog as string);
  if (!catalogInfo) return null;

  const chapters = doc.chapters as Record<string, unknown>;
  const notes = (doc.notes as string) ?? '';

  return {
    title: (doc.title as string) || 'Untitled VPAT',
    description: notes.trim() ? notes : null,
    ...catalogInfo,
    wcag_level: inferWcagLevel(chapters),
    criteria: extractCriteria(chapters),
  };
}
