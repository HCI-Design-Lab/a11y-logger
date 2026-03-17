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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const CONFORMANCE_OPTIONS = [
  { value: 'not_evaluated', label: 'Not Evaluated' },
  { value: 'supports', label: 'Supports' },
  { value: 'partially_supports', label: 'Partial Support' },
  { value: 'does_not_support', label: 'Does Not Support' },
  { value: 'not_applicable', label: 'Not Applicable' },
] as const;

const SECTION_LABELS: Record<string, string> = {
  A: 'Table 1: Success Criteria (A)',
  AA: 'Table 2: Success Criteria Level AA',
  AAA: 'Table 3: Success Criteria Level AAA',
  Chapter3: 'Chapter 3: Functional Performance Criteria',
  Chapter5: 'Chapter 5: Software',
  Chapter6: 'Chapter 6: Support Documentation and Services',
  Clause4: 'Clause 4: Functional Performance Statements',
  Clause5: 'Clause 5: Generic Requirements',
  Clause12: 'Clauses 11-12: Documentation and Support Services',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};

interface VpatCriteriaTableProps {
  rows: VpatCriterionRow[];
  onRowChange: (rowId: string, update: { conformance?: string; remarks?: string }) => void;
  onGenerateRow?: (rowId: string) => void;
  onGenerateAll?: () => void;
  generatingRowId?: string | null;
  readOnly?: boolean;
  aiEnabled?: boolean;
}

export function VpatCriteriaTable({
  rows,
  onRowChange,
  onGenerateRow,
  onGenerateAll,
  generatingRowId,
  readOnly = false,
  aiEnabled = false,
}: VpatCriteriaTableProps) {
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());

  // Group rows by section
  const sections = rows.reduce<Map<string, VpatCriterionRow[]>>((acc, row) => {
    const section = row.criterion_section;
    if (!acc.has(section)) acc.set(section, []);
    acc.get(section)!.push(row);
    return acc;
  }, new Map());

  const toggleReasoning = (rowId: string) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {aiEnabled && !readOnly && onGenerateAll && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onGenerateAll}>
            Generate All
          </Button>
        </div>
      )}
      {Array.from(sections.entries()).map(([section, sectionRows]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-base">{SECTION_LABELS[section] ?? section}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Criterion</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-48">Conformance</TableHead>
                  <TableHead>Remarks</TableHead>
                  {aiEnabled && !readOnly && <TableHead className="w-28">AI</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionRows.map((row) => {
                  const isUnresolved = row.conformance === 'not_evaluated';
                  const isExpanded = expandedReasoning.has(row.id);
                  const isGenerating = generatingRowId === row.id;
                  const conformanceLabel =
                    CONFORMANCE_OPTIONS.find((o) => o.value === row.conformance)?.label ??
                    row.conformance;

                  return (
                    <TableRow
                      key={row.id}
                      data-testid={`row-${row.id}`}
                      className={`border-l-4 ${isUnresolved ? 'border-amber-400' : 'border-transparent'}`}
                    >
                      <TableCell className="font-mono text-sm align-top pt-3">
                        {row.criterion_code}
                      </TableCell>
                      <TableCell className="align-top pt-3">
                        <div className="font-medium text-sm">{row.criterion_name}</div>
                      </TableCell>
                      <TableCell className="align-top pt-3">
                        {readOnly ? (
                          <span className="text-sm">{conformanceLabel}</span>
                        ) : (
                          <Select
                            value={row.conformance}
                            onValueChange={(v) => onRowChange(row.id, { conformance: v })}
                          >
                            <SelectTrigger
                              className="h-8 text-sm"
                              aria-label={`Conformance for ${row.criterion_code}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONFORMANCE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="align-top pt-2">
                        {/* AI confidence badge + reasoning toggle */}
                        {(row.ai_confidence || row.ai_reasoning) && (
                          <div className="mb-1 flex items-center gap-2">
                            {row.ai_confidence && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${CONFIDENCE_COLORS[row.ai_confidence] ?? ''}`}
                              >
                                {row.ai_confidence}
                              </Badge>
                            )}
                            {row.ai_reasoning && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleReasoning(row.id)}
                                aria-label="Why?"
                              >
                                Why?
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Low confidence warning */}
                        {row.ai_confidence === 'low' && (
                          <p className="text-xs text-amber-600 mb-1">
                            AI flagged limited evidence — consider additional testing before setting
                            conformance.
                          </p>
                        )}

                        {/* Reasoning expandable */}
                        {isExpanded && row.ai_reasoning && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-1 whitespace-pre-wrap">
                            {row.ai_reasoning}
                          </div>
                        )}

                        {readOnly ? (
                          <span className="text-sm text-muted-foreground">
                            {row.remarks || '—'}
                          </span>
                        ) : (
                          <Textarea
                            value={row.remarks ?? ''}
                            onChange={(e) => onRowChange(row.id, { remarks: e.target.value })}
                            rows={2}
                            className="text-sm min-h-0"
                            placeholder="Add remarks…"
                            aria-label={`Remarks for ${row.criterion_code}`}
                          />
                        )}
                      </TableCell>
                      {aiEnabled && !readOnly && (
                        <TableCell className="align-top pt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onGenerateRow?.(row.id)}
                            disabled={isGenerating}
                            aria-label={
                              isGenerating
                                ? `Generating for ${row.criterion_code}`
                                : `Generate for ${row.criterion_code}`
                            }
                          >
                            {isGenerating ? 'Generating…' : 'Generate'}
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
      ))}
    </div>
  );
}
