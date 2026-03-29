'use client';

import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegister } from 'react-hook-form';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
  A: 'Table 1: Success Criteria, Level A',
  AA: 'Table 2: Success Criteria, Level AA',
  AAA: 'Table 3: Success Criteria, Level AAA',
  Chapter3: 'Chapter 3: Functional Performance Criteria',
  Chapter5: 'Chapter 5: Software',
  Chapter6: 'Chapter 6: Support Documentation and Services',
  Clause4: 'Clause 4: Functional Performance Statements',
  Clause5: 'Clause 5: Generic Requirements',
  Clause12: 'Clauses 11-12: Documentation and Support Services',
};

// Canonical standard groups — defines display order and which sections belong to each standard.
const STANDARD_GROUPS: { label: string; sections: string[] }[] = [
  { label: 'WCAG', sections: ['A', 'AA', 'AAA'] },
  { label: 'Section 508', sections: ['Chapter3', 'Chapter5', 'Chapter6'] },
  { label: 'EN 301 549', sections: ['Clause4', 'Clause5', 'Clause12'] },
];

// WCAG rows are stored with criterion_section = principle name (Perceivable etc.)
// but must be grouped by criterion_level (A/AA/AAA) to match the standard VPAT table format.
const WCAG_PRINCIPLE_SECTIONS = new Set(['Perceivable', 'Operable', 'Understandable', 'Robust']);

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};

type RemarksFormValues = Record<string, string>;

interface CriterionTableRowProps {
  row: VpatCriterionRow;
  readOnly: boolean;
  aiEnabled: boolean;
  isGenerating: boolean;
  onRowChange: (rowId: string, update: { conformance?: string }) => void;
  scheduleRemarksSave: (rowId: string, value: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onCriterionClick?: (criterionCode: string) => void;
  register: UseFormRegister<RemarksFormValues>;
}

// Isolated per-row component — owns isExpanded state so toggling reasoning
// only re-renders this row, not the entire table.
const CriterionTableRow = memo(function CriterionTableRow({
  row,
  readOnly,
  aiEnabled,
  isGenerating,
  onRowChange,
  scheduleRemarksSave,
  onGenerateRow,
  onCriterionClick,
  register,
}: CriterionTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleReasoning = useCallback(() => setIsExpanded((v) => !v), []);

  const isUnresolved = row.conformance === 'not_evaluated';
  const conformanceLabel =
    CONFORMANCE_OPTIONS.find((o) => o.value === row.conformance)?.label ?? row.conformance;

  return (
    <TableRow
      data-testid={`row-${row.id}`}
      className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-transparent'}`}
    >
      <TableCell className="font-mono text-sm align-top pt-3">{row.criterion_code}</TableCell>
      <TableCell className="align-top pt-3">
        {onCriterionClick ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-medium text-sm text-left"
            onClick={() => onCriterionClick(row.criterion_code)}
            aria-label={`View issues for ${row.criterion_code}`}
          >
            {row.criterion_name}
            {!readOnly && row.issue_count > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({row.issue_count})
              </span>
            )}
          </Button>
        ) : (
          <div className="font-medium text-sm">
            {row.criterion_name}
            {!readOnly && row.issue_count > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({row.issue_count})
              </span>
            )}
          </div>
        )}
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
        {!readOnly && (row.ai_confidence || row.ai_reasoning) && (
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
                onClick={toggleReasoning}
                aria-label={
                  isExpanded
                    ? `Hide reasoning for ${row.criterion_code}`
                    : `Show reasoning for ${row.criterion_code}`
                }
                aria-expanded={isExpanded}
              >
                Why?
              </Button>
            )}
          </div>
        )}

        {/* Low confidence warning */}
        {!readOnly && row.ai_confidence === 'low' && (
          <p className="text-xs text-amber-600 mb-1">
            AI flagged limited evidence — consider additional testing before setting conformance.
          </p>
        )}

        {/* Reasoning expandable */}
        {!readOnly && isExpanded && row.ai_reasoning && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-1 whitespace-pre-wrap">
            {row.ai_reasoning}
          </div>
        )}

        {readOnly ? (
          <span className="text-sm text-muted-foreground whitespace-pre-wrap">{row.remarks || '—'}</span>
        ) : (
          <Textarea
            {...register(row.id, {
              onChange: (e) => scheduleRemarksSave(row.id, e.target.value),
            })}
            rows={2}
            className="text-sm min-h-0"
            placeholder="Add remarks…"
            aria-label={`Remarks for ${row.criterion_code}`}
          />
        )}
      </TableCell>
      {aiEnabled && !readOnly && (
        <TableCell className="align-top pt-3 text-center">
          <Button
            type="button"
            variant="ai"
            size="sm"
            onClick={() => onGenerateRow?.(row.id)}
            disabled={isGenerating}
            aria-label={
              isGenerating
                ? `Generating for ${row.criterion_code}`
                : `Generate for ${row.criterion_code}`
            }
          >
            <Sparkles />
            {isGenerating ? 'Generating…' : 'Generate'}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
});

interface CriterionSectionProps {
  section: string;
  sectionRows: VpatCriterionRow[];
  readOnly: boolean;
  aiEnabled: boolean;
  generatingRowId?: string | null;
  onRowChange: (rowId: string, update: { conformance?: string }) => void;
  scheduleRemarksSave: (rowId: string, value: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onCriterionClick?: (criterionCode: string) => void;
  register: UseFormRegister<RemarksFormValues>;
}

// Collapsible section card — owns isExpanded state so toggling only re-renders this section.
const CriterionSection = memo(function CriterionSection({
  section,
  sectionRows,
  readOnly,
  aiEnabled,
  generatingRowId,
  onRowChange,
  scheduleRemarksSave,
  onGenerateRow,
  onCriterionClick,
  register,
}: CriterionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const label = SECTION_LABELS[section] ?? section;
  const resolved = sectionRows.filter((r) => r.conformance !== 'not_evaluated').length;
  const total = sectionRows.length;

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="flex items-center gap-3 shrink-0">
            {!isExpanded && (
              <span className="text-sm text-muted-foreground">
                {resolved} of {total} resolved
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsExpanded((v) => !v)}
              aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Criterion</TableHead>
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead className="w-40">Conformance</TableHead>
                <TableHead className="w-[30%]">Remarks</TableHead>
                {aiEnabled && !readOnly && <TableHead className="w-36 text-center">AI</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectionRows.map((row) => (
                <CriterionTableRow
                  key={row.id}
                  row={row}
                  readOnly={readOnly}
                  aiEnabled={aiEnabled}
                  isGenerating={generatingRowId === row.id}
                  onRowChange={onRowChange}
                  scheduleRemarksSave={scheduleRemarksSave}
                  onGenerateRow={onGenerateRow}
                  onCriterionClick={onCriterionClick}
                  register={register}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
});

interface VpatCriteriaTableProps {
  rows: VpatCriterionRow[];
  /** Called immediately for conformance changes (updates progress bar in parent). */
  onRowChange: (rowId: string, update: { conformance?: string }) => void;
  /** Called after 500ms debounce when the user finishes typing remarks. */
  onSaveRemarks: (rowId: string, remarks: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onGenerateAll?: () => void;
  generatingRowId?: string | null;
  readOnly?: boolean;
  aiEnabled?: boolean;
  onCriterionClick?: (criterionCode: string) => void;
}

export function VpatCriteriaTable({
  rows,
  onRowChange,
  onSaveRemarks,
  onGenerateRow,
  onGenerateAll,
  generatingRowId,
  readOnly = false,
  aiEnabled = false,
  onCriterionClick,
}: VpatCriteriaTableProps) {
  // RHF manages remarks as uncontrolled inputs — typing never triggers React re-renders.
  const { register } = useForm<RemarksFormValues>({
    defaultValues: Object.fromEntries(rows.map((r) => [r.id, r.remarks ?? ''])),
  });

  // Per-row debounce timers for remarks saves.
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const scheduleRemarksSave = useCallback(
    (rowId: string, value: string) => {
      const existing = saveTimers.current.get(rowId);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        rowId,
        setTimeout(() => onSaveRemarks(rowId, value), 500)
      );
    },
    [onSaveRemarks]
  );

  // Group rows: WCAG rows by criterion_level (A/AA/AAA), all others by criterion_section.
  const sections = useMemo(
    () =>
      rows.reduce<Map<string, VpatCriterionRow[]>>((acc, row) => {
        const key = WCAG_PRINCIPLE_SECTIONS.has(row.criterion_section)
          ? (row.criterion_level ?? 'A')
          : row.criterion_section;
        if (!acc.has(key)) acc.set(key, []);
        acc.get(key)!.push(row);
        return acc;
      }, new Map()),
    [rows]
  );

  return (
    <div className="space-y-6">
      {aiEnabled && !readOnly && onGenerateAll && (
        <div className="flex justify-end">
          <Button type="button" variant="ai" size="sm" onClick={onGenerateAll}>
            <Sparkles />
            Generate All
          </Button>
        </div>
      )}
      {STANDARD_GROUPS.map((group) => {
        const groupSections = group.sections.filter((s) => sections.has(s));
        if (groupSections.length === 0) return null;
        return (
          <div key={group.label} className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">{group.label}</h2>
            {groupSections.map((section) => (
              <CriterionSection
                key={section}
                section={section}
                sectionRows={sections.get(section)!}
                readOnly={readOnly}
                aiEnabled={aiEnabled}
                generatingRowId={generatingRowId}
                onRowChange={onRowChange}
                scheduleRemarksSave={scheduleRemarksSave}
                onGenerateRow={onGenerateRow}
                onCriterionClick={onCriterionClick}
                register={register}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
