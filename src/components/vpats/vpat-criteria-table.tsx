'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WCAG_CRITERIA,
  CONFORMANCE_OPTIONS,
  CONFORMANCE_DISPLAY,
  CONFORMANCE_DB_VALUE,
} from '@/lib/vpats/wcag-criteria';

export interface CriterionRow {
  criterion_code: string;
  conformance: string;
  remarks: string | null | undefined;
  related_issue_ids: string[];
}

interface VpatCriteriaTableProps {
  criteria: CriterionRow[];
  onChange?: (criteria: CriterionRow[]) => void;
  readOnly?: boolean;
  /** When provided, shows AI Generate buttons per criterion */
  projectId?: string;
  /** Called with criterion code when the issues badge is clicked */
  onIssuesBadgeClick?: (criterionCode: string) => void;
  /** Called when the Generate All button is clicked */
  onGenerateAll?: () => void;
}

const LEVELS = ['A', 'AA', 'AAA'] as const;

const TABLE_TITLES: Record<string, string> = {
  A: 'Table 1: Success Criteria, A',
  AA: 'Table 2: Success Criteria, AA',
  AAA: 'Table 3: Success Criteria, AAA',
};

export function VpatCriteriaTable({
  criteria,
  onChange,
  readOnly = false,
  projectId,
  onIssuesBadgeClick,
  onGenerateAll,
}: VpatCriteriaTableProps) {
  const [aiLoadingCode, setAiLoadingCode] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const updateRow = (criterion_code: string, field: keyof CriterionRow, value: string) => {
    onChange?.(
      criteria.map((r) => (r.criterion_code === criterion_code ? { ...r, [field]: value } : r))
    );
  };

  const handleAiGenerate = async (criterionCode: string) => {
    if (!projectId) return;

    setAiLoadingCode(criterionCode);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate-vpat-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, criterionCode }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAiError(json.error ?? 'Failed to generate narrative');
        return;
      }

      const { narrative } = json.data as { narrative: string };
      updateRow(criterionCode, 'remarks', narrative);
    } catch {
      setAiError('Failed to connect to AI service');
    } finally {
      setAiLoadingCode(null);
    }
  };

  return (
    <div className="space-y-8">
      {aiError && <p className="text-sm text-destructive">{aiError}</p>}

      {projectId && !readOnly && onGenerateAll && (
        <div className="flex justify-end mb-4">
          <Button type="button" variant="outline" onClick={onGenerateAll}>
            Generate All
          </Button>
        </div>
      )}

      {LEVELS.map((level) => {
        const rows = criteria.filter((r) => {
          const meta = WCAG_CRITERIA.find((c) => c.criterion === r.criterion_code);
          return meta?.level === level;
        });
        if (rows.length === 0) return null;

        return (
          <Card key={level}>
            <CardHeader>
              <CardTitle>{TABLE_TITLES[level]}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Criterion</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-48">Conformance</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="w-24">Issues</TableHead>
                    {projectId && !readOnly && <TableHead className="w-32">AI</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const meta = WCAG_CRITERIA.find((c) => c.criterion === row.criterion_code);
                    // Display value: convert db snake_case to human-readable label
                    const displayConformance =
                      CONFORMANCE_DISPLAY[row.conformance as keyof typeof CONFORMANCE_DISPLAY] ??
                      row.conformance;
                    const isGenerating = aiLoadingCode === row.criterion_code;
                    const issueCount = row.related_issue_ids.length;

                    return (
                      <TableRow key={row.criterion_code}>
                        <TableCell className="font-mono text-sm">{row.criterion_code}</TableCell>
                        <TableCell>{meta?.name ?? row.criterion_code}</TableCell>
                        <TableCell>
                          {readOnly ? (
                            <span className="text-sm">{displayConformance}</span>
                          ) : (
                            <Select
                              value={displayConformance}
                              onValueChange={(v) =>
                                updateRow(
                                  row.criterion_code,
                                  'conformance',
                                  CONFORMANCE_DB_VALUE[v as (typeof CONFORMANCE_OPTIONS)[number]] ??
                                    v
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-8 text-sm"
                                aria-label={`Conformance for ${row.criterion_code}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONFORMANCE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {readOnly ? (
                            <span className="text-sm text-muted-foreground">
                              {row.remarks || '—'}
                            </span>
                          ) : (
                            <Textarea
                              value={row.remarks ?? ''}
                              onChange={(e) =>
                                updateRow(row.criterion_code, 'remarks', e.target.value)
                              }
                              rows={2}
                              className="text-sm min-h-0"
                              placeholder="Add remarks…"
                              aria-label={`Remarks for ${row.criterion_code}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {issueCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => onIssuesBadgeClick?.(row.criterion_code)}
                              aria-label={`${issueCount} issue${issueCount !== 1 ? 's' : ''}`}
                              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 min-w-[1.5rem] cursor-pointer hover:bg-primary/90"
                            >
                              {issueCount} issue{issueCount !== 1 ? 's' : ''}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        {projectId && !readOnly && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiGenerate(row.criterion_code)}
                              disabled={isGenerating}
                              aria-label={
                                isGenerating
                                  ? `Generating narrative for ${row.criterion_code}`
                                  : `AI Generate for ${row.criterion_code}`
                              }
                            >
                              {isGenerating ? 'Generating…' : 'AI Generate'}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
