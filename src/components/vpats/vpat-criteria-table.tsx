'use client';

import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegister } from 'react-hook-form';
import { ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const SUGGESTED_CONFORMANCE_COLORS: Record<string, string> = {
  supports: 'border-green-500 text-green-700',
  does_not_support: 'border-red-500 text-red-700',
  not_applicable: 'border-gray-400 text-gray-600',
};

const SUGGESTED_CONFORMANCE_LABELS: Record<string, string> = {
  supports: 'Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
};

type RemarksFormValues = Record<string, string>;

interface CriterionTableRowProps {
  row: VpatCriterionRow;
  isEven: boolean;
  readOnly: boolean;
  aiEnabled: boolean;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  onRowChange: (rowId: string, update: { conformance?: string }) => void;
  scheduleRemarksSave: (rowId: string, value: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onCriterionClick?: (criterionCode: string) => void;
  register: UseFormRegister<RemarksFormValues>;
}

// Isolated per-row component — owns modal state so toggling AI info
// only re-renders this row, not the entire table.
const CriterionTableRow = memo(function CriterionTableRow({
  row,
  isEven,
  readOnly,
  aiEnabled,
  isGenerating,
  isGeneratingAll,
  onRowChange,
  scheduleRemarksSave,
  onGenerateRow,
  onCriterionClick,
  register,
}: CriterionTableRowProps) {
  const isDisabled = isGenerating || isGeneratingAll;
  const [showAiInfo, setShowAiInfo] = useState(false);
  const hasAiInfo = !!(row.ai_confidence || row.ai_reasoning);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Resize after row.remarks changes — rAF lets the parent's setValue update the DOM first.
  useEffect(() => {
    requestAnimationFrame(() => autoResize(textareaRef.current));
  }, [row.remarks, autoResize]);

  const isUnresolved = row.conformance === 'not_evaluated';
  const conformanceLabel =
    CONFORMANCE_OPTIONS.find((o) => o.value === row.conformance)?.label ?? row.conformance;

  return (
    <>
    <TableRow
      data-testid={`row-${row.id}`}
      className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-primary border-l-0'} ${isEven ? 'bg-muted' : ''}`}
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
            disabled={isDisabled}
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
        {readOnly ? (
          <span className="text-sm text-muted-foreground whitespace-pre-wrap">{row.remarks || '—'}</span>
        ) : (
          <Textarea
            {...(() => {
              const { ref, ...rest } = register(row.id, {
                onChange: (e) => scheduleRemarksSave(row.id, e.target.value),
              });
              return {
                ...rest,
                ref: (el: HTMLTextAreaElement | null) => {
                  ref(el);
                  textareaRef.current = el;
                },
              };
            })()}
            className="text-sm min-h-10 overflow-hidden"
            style={{ resize: 'vertical' }}
            placeholder="Add remarks…"
            disabled={isDisabled}
            onInput={(e) => autoResize(e.currentTarget)}
            aria-label={`Remarks for ${row.criterion_code}`}
          />
        )}
      </TableCell>
      {aiEnabled && !readOnly && (
        <TableCell className="align-top pt-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Button
              type="button"
              variant="ai"
              size="sm"
              onClick={() => onGenerateRow?.(row.id)}
              disabled={isDisabled}
              aria-label={
                isGenerating
                  ? `Generating for ${row.criterion_code}`
                  : `Generate for ${row.criterion_code}`
              }
            >
              <Sparkles />
              {isGenerating ? 'Generating…' : 'Generate'}
            </Button>
            {hasAiInfo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowAiInfo(true)}
                aria-label={`AI info for ${row.criterion_code}`}
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>

    {hasAiInfo && (
      <Dialog open={showAiInfo} onOpenChange={setShowAiInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Analysis — {row.criterion_code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {row.ai_confidence && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Confidence</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${CONFIDENCE_COLORS[row.ai_confidence] ?? ''}`}
                >
                  {row.ai_confidence}
                </Badge>
                {row.ai_confidence === 'low' && (
                  <span className="text-xs text-amber-600">
                    Limited evidence — consider additional testing.
                  </span>
                )}
              </div>
            )}

            {row.ai_suggested_conformance && (
              <div>
                <p className="text-sm font-medium mb-1">Suggested Conformance</p>
                <Badge
                  variant="outline"
                  className={`text-xs ${SUGGESTED_CONFORMANCE_COLORS[row.ai_suggested_conformance] ?? ''}`}
                >
                  {SUGGESTED_CONFORMANCE_LABELS[row.ai_suggested_conformance]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  AI recommendation only — does not update the conformance selector.
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">
                Issues Referenced
                {row.ai_referenced_issues && row.ai_referenced_issues.length > 0 && (
                  <span className="font-normal text-muted-foreground ml-1">
                    ({row.ai_referenced_issues.length})
                  </span>
                )}
              </p>
              {row.ai_referenced_issues && row.ai_referenced_issues.length > 0 ? (
                <ul className="space-y-1">
                  {row.ai_referenced_issues.map((issue, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground flex-1">{issue.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {issue.severity}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No issues mapped to this criterion.</p>
              )}
            </div>

            {row.ai_reasoning && (
              <div>
                <p className="text-sm font-medium mb-1">Reasoning</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.ai_reasoning}</p>
              </div>
            )}

            {row.last_generated_at && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                Generated{' '}
                {new Date(row.last_generated_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
});

interface CriterionSectionProps {
  section: string;
  sectionRows: VpatCriterionRow[];
  readOnly: boolean;
  aiEnabled: boolean;
  generatingRowId?: string | null;
  isGeneratingAll: boolean;
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
  isGeneratingAll,
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
                <TableHead className={readOnly ? 'w-16' : 'w-20'}>Criterion</TableHead>
                <TableHead className={readOnly ? 'w-[20%]' : 'w-[30%]'}>Name</TableHead>
                <TableHead className={readOnly ? 'w-28' : 'w-40'}>Conformance</TableHead>
                <TableHead>Remarks</TableHead>
                {aiEnabled && !readOnly && <TableHead className="w-36 text-center">AI</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectionRows.map((row, i) => (
                <CriterionTableRow
                  key={row.id}
                  row={row}
                  isEven={i % 2 === 0}
                  readOnly={readOnly}
                  aiEnabled={aiEnabled}
                  isGenerating={generatingRowId === row.id}
                  isGeneratingAll={isGeneratingAll}
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
  isGeneratingAll?: boolean;
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
  isGeneratingAll = false,
  readOnly = false,
  aiEnabled = false,
  onCriterionClick,
}: VpatCriteriaTableProps) {
  // RHF manages remarks as uncontrolled inputs — typing never triggers React re-renders.
  const { register, setValue, getValues } = useForm<RemarksFormValues>({
    defaultValues: Object.fromEntries(rows.map((r) => [r.id, r.remarks ?? ''])),
  });

  // Sync rows → form when AI generation updates remarks outside of user input.
  useEffect(() => {
    rows.forEach((row) => {
      if (getValues(row.id) !== (row.remarks ?? '')) {
        setValue(row.id, row.remarks ?? '');
      }
    });
  }, [rows, setValue, getValues]);

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
          <Button type="button" variant="ai" size="sm" onClick={onGenerateAll} disabled={isGeneratingAll}>
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
                isGeneratingAll={isGeneratingAll}
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
