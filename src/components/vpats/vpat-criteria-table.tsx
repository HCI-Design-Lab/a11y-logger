'use client';

import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegister } from 'react-hook-form';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VpatAiPanel } from '@/components/vpats/vpat-ai-panel';
import { VpatCriteriaRow } from '@/components/vpats/vpat-criteria-row';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

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

type RemarksFormValues = Record<string, string>;

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
  onAiInfoClick?: (row: VpatCriterionRow) => void;
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
  onAiInfoClick,
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
                <VpatCriteriaRow
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
                  onAiInfoClick={onAiInfoClick}
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
  const [aiPanelRow, setAiPanelRow] = useState<VpatCriterionRow | null>(null);

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
          <Button
            type="button"
            variant="ai"
            size="sm"
            onClick={onGenerateAll}
            disabled={isGeneratingAll}
          >
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
                onAiInfoClick={setAiPanelRow}
                register={register}
              />
            ))}
          </div>
        );
      })}
      {aiPanelRow && <VpatAiPanel row={aiPanelRow} onClose={() => setAiPanelRow(null)} />}
    </div>
  );
}
