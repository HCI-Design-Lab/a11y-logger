'use client';

import { useCallback, useEffect, useRef, memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { Info, Sparkles } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const CONFORMANCE_OPTIONS = [
  { value: 'not_evaluated', label: 'Not Evaluated' },
  { value: 'supports', label: 'Supports' },
  { value: 'partially_supports', label: 'Partial Support' },
  { value: 'does_not_support', label: 'Does Not Support' },
  { value: 'not_applicable', label: 'Not Applicable' },
] as const;

type RemarksFormValues = Record<string, string>;

export interface VpatCriteriaRowProps {
  row: VpatCriterionRow;
  locale?: string;
  isEven: boolean;
  readOnly: boolean;
  aiEnabled: boolean;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  onRowChange: (rowId: string, update: { conformance?: string; component_name?: string }) => void;
  scheduleRemarksSave: (rowId: string, value: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onCriterionClick?: (criterionCode: string) => void;
  onAiInfoClick?: (row: VpatCriterionRow) => void;
  register: UseFormRegister<RemarksFormValues>;
}

export const VpatCriteriaRow = memo(function VpatCriteriaRow({
  row,
  locale = 'en',
  isEven,
  readOnly,
  aiEnabled,
  isGenerating,
  isGeneratingAll,
  onRowChange,
  scheduleRemarksSave,
  onGenerateRow,
  onCriterionClick,
  onAiInfoClick,
  register,
}: VpatCriteriaRowProps) {
  const isDisabled = isGenerating || isGeneratingAll;
  const displayName = row.criterion_name_translated ?? row.criterion_name;
  const showEnBadge = locale !== 'en' && row.criterion_name_translated === null;
  const hasAiInfo = !!(
    row.ai_confidence ||
    row.ai_reasoning ||
    row.ai_suggested_conformance ||
    row.ai_referenced_issues
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Sync textarea value when row.remarks changes externally (e.g. AI generation).
  // Direct DOM update is more reliable than relying on RHF setValue from the parent.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.value !== (row.remarks ?? '')) {
      el.value = row.remarks ?? '';
    }
    requestAnimationFrame(() => autoResize(el));
  }, [row.remarks, autoResize]);

  const isUnresolved = row.conformance === 'not_evaluated';
  const conformanceLabel =
    CONFORMANCE_OPTIONS.find((o) => o.value === row.conformance)?.label ?? row.conformance;

  const isMultiComponent = (row.components?.length ?? 0) > 1;

  const criterionNameCell = (
    <TableCell className="align-top pt-3">
      {onCriterionClick ? (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-medium text-sm text-left"
          onClick={() => onCriterionClick(row.criterion_code)}
          aria-label={`View issues for ${row.criterion_code}`}
        >
          {displayName}
          {showEnBadge && <span className="ml-1 text-xs text-muted-foreground">EN</span>}
          {!readOnly && row.issue_count > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({row.issue_count})
            </span>
          )}
        </Button>
      ) : (
        <div className="font-medium text-sm">
          {displayName}
          {showEnBadge && <span className="ml-1 text-xs text-muted-foreground">EN</span>}
          {!readOnly && row.issue_count > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({row.issue_count})
            </span>
          )}
        </div>
      )}
    </TableCell>
  );

  if (isMultiComponent) {
    const colSpan = aiEnabled && !readOnly ? 5 : 4;
    return (
      <>
        <TableRow
          data-testid={`row-${row.id}`}
          className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-primary border-l-0'} ${isEven ? 'bg-muted' : ''}`}
        >
          <TableCell className="font-mono text-sm align-top pt-3">{row.criterion_code}</TableCell>
          {criterionNameCell}
          <TableCell colSpan={colSpan - 2} className="p-0">
            <table data-testid="component-sub-table" className="w-full">
              <tbody>
                {(row.components ?? []).map((comp) => {
                  const compConformanceLabel =
                    CONFORMANCE_OPTIONS.find((o) => o.value === comp.conformance)?.label ??
                    comp.conformance;
                  return (
                    <tr key={comp.component_name}>
                      <td className="px-3 py-2 text-sm w-32 font-medium">{comp.component_name}</td>
                      <td className="px-3 py-2 w-40">
                        {readOnly ? (
                          <span className="text-sm">{compConformanceLabel}</span>
                        ) : (
                          <Select
                            value={comp.conformance}
                            onValueChange={(v) =>
                              onRowChange(row.id, {
                                conformance: v,
                                component_name: comp.component_name,
                              })
                            }
                            disabled={isDisabled}
                          >
                            <SelectTrigger
                              className="h-8 text-sm"
                              aria-label={`Conformance for ${row.criterion_code} — ${comp.component_name}`}
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
                      </td>
                      <td className="px-3 py-2">
                        {readOnly ? (
                          <span className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {comp.remarks || '—'}
                          </span>
                        ) : (
                          <Textarea
                            className="text-sm min-h-10 overflow-hidden"
                            style={{ resize: 'vertical' }}
                            placeholder="Add remarks…"
                            disabled={isDisabled}
                            defaultValue={comp.remarks ?? ''}
                            aria-label={`Remarks for ${row.criterion_code} — ${comp.component_name}`}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    onClick={() => onAiInfoClick?.(row)}
                    aria-label={`AI info for ${row.criterion_code}`}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          )}
        </TableRow>
      </>
    );
  }

  return (
    <>
      <TableRow
        data-testid={`row-${row.id}`}
        className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-primary border-l-0'} ${isEven ? 'bg-muted' : ''}`}
      >
        <TableCell className="font-mono text-sm align-top pt-3">{row.criterion_code}</TableCell>
        {criterionNameCell}
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
            <span className="text-sm text-muted-foreground whitespace-pre-wrap">
              {row.remarks || '—'}
            </span>
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
                  onClick={() => onAiInfoClick?.(row)}
                  aria-label={`AI info for ${row.criterion_code}`}
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    </>
  );
});
