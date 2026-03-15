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
}

const PRINCIPLES = ['Perceivable', 'Operable', 'Understandable', 'Robust'] as const;

export function VpatCriteriaTable({
  criteria,
  onChange,
  readOnly = false,
  projectId,
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
      {PRINCIPLES.map((principle) => {
        const rows = criteria.filter((r) => {
          const meta = WCAG_CRITERIA.find((c) => c.criterion === r.criterion_code);
          return meta?.principle === principle;
        });
        if (rows.length === 0) return null;

        return (
          <Card key={principle}>
            <CardHeader>
              <CardTitle>{principle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Criterion</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-16">Level</TableHead>
                    <TableHead className="w-48">Conformance</TableHead>
                    <TableHead>Remarks</TableHead>
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

                    return (
                      <TableRow key={row.criterion_code}>
                        <TableCell className="font-mono text-sm">{row.criterion_code}</TableCell>
                        <TableCell>{meta?.name ?? row.criterion_code}</TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">{meta?.level ?? ''}</span>
                        </TableCell>
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
