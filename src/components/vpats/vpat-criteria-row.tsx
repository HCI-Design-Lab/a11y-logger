'use client';

import { useCallback, useEffect, useRef, memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslations } from 'next-intl';
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

const CONFORMANCE_VALUES = [
  'not_evaluated',
  'supports',
  'partially_supports',
  'does_not_support',
  'not_applicable',
] as const;

type ConformanceValue = (typeof CONFORMANCE_VALUES)[number];

type RemarksFormValues = Record<string, string>;

export interface VpatCriteriaRowProps {
  row: VpatCriterionRow;
  locale?: string;
  readOnly: boolean;
  aiEnabled: boolean;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  onRowChange: (rowId: string, update: { conformance?: string; component_name?: string }) => void;
  scheduleRemarksSave: (rowId: string, value: string, componentName?: string) => void;
  onGenerateRow?: (rowId: string) => void;
  onCriterionClick?: (criterionCode: string) => void;
  onAiInfoClick?: (row: VpatCriterionRow) => void;
  register: UseFormRegister<RemarksFormValues>;
}

export const VpatCriteriaRow = memo(function VpatCriteriaRow({
  row,
  locale = 'en',
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
  const tConformance = useTranslations('vpats.conformance');
  const tCriteria = useTranslations('vpats.criteria');

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
  const compRemarkRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
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

  // Sync per-component textarea values when component remarks change externally (AI generation).
  useEffect(() => {
    (row.components ?? []).forEach((comp) => {
      const el = compRemarkRefs.current.get(comp.component_name);
      if (el && el.value !== (comp.remarks ?? '')) {
        el.value = comp.remarks ?? '';
        requestAnimationFrame(() => autoResize(el));
      }
    });
  }, [row.components, autoResize]);

  const isUnresolved = row.conformance === 'not_evaluated';
  const conformanceLabel = CONFORMANCE_VALUES.includes(row.conformance as ConformanceValue)
    ? tConformance(row.conformance as ConformanceValue)
    : row.conformance;

  const isMultiComponent = (row.components?.length ?? 0) > 1;

  const criterionNameCell = (
    <TableCell className="align-top pt-3">
      {onCriterionClick ? (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-medium text-sm text-left"
          onClick={() => onCriterionClick(row.criterion_code)}
          aria-label={tCriteria('view_issues_aria_label', { code: row.criterion_code })}
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
    return (
      <>
        <TableRow
          data-testid={`row-${row.id}`}
          className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-primary border-l-0'}`}
        >
          <TableCell className="font-mono text-sm align-top pt-3">{row.criterion_code}</TableCell>
          {criterionNameCell}
          <TableCell colSpan={2} className="p-0">
            <table data-testid="component-sub-table" className="w-full">
              <tbody>
                {(row.components ?? []).map((comp) => {
                  const compConformanceLabel = CONFORMANCE_VALUES.includes(
                    comp.conformance as ConformanceValue
                  )
                    ? tConformance(comp.conformance as ConformanceValue)
                    : comp.conformance;
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
                              aria-label={tCriteria('conformance_aria_label', {
                                code: `${row.criterion_code} — ${comp.component_name}`,
                              })}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONFORMANCE_VALUES.map((val) => (
                                <SelectItem key={val} value={val}>
                                  {tConformance(val)}
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
                            ref={(el) => {
                              if (el) compRemarkRefs.current.set(comp.component_name, el);
                              else compRemarkRefs.current.delete(comp.component_name);
                            }}
                            className="text-sm min-h-10 overflow-hidden"
                            style={{ resize: 'vertical' }}
                            placeholder={tCriteria('remarks_placeholder')}
                            disabled={isDisabled}
                            defaultValue={comp.remarks ?? ''}
                            onChange={(e) =>
                              scheduleRemarksSave(row.id, e.target.value, comp.component_name)
                            }
                            aria-label={tCriteria('remarks_aria_label', {
                              code: `${row.criterion_code} — ${comp.component_name}`,
                            })}
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
                      ? tCriteria('generating_aria_label', { code: row.criterion_code })
                      : tCriteria('generate_aria_label', { code: row.criterion_code })
                  }
                >
                  <Sparkles />
                  {isGenerating ? tCriteria('generating') : tCriteria('generate')}
                </Button>
                {hasAiInfo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onAiInfoClick?.(row)}
                    aria-label={tCriteria('ai_info_aria_label', { code: row.criterion_code })}
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
        className={`border-l-4 ${!readOnly && isUnresolved ? 'border-amber-400' : 'border-primary border-l-0'}`}
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
                aria-label={tCriteria('conformance_aria_label', { code: row.criterion_code })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFORMANCE_VALUES.map((val) => (
                  <SelectItem key={val} value={val}>
                    {tConformance(val)}
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
              placeholder={tCriteria('remarks_placeholder')}
              disabled={isDisabled}
              onInput={(e) => autoResize(e.currentTarget)}
              aria-label={tCriteria('remarks_aria_label', { code: row.criterion_code })}
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
                    ? tCriteria('generating_aria_label', { code: row.criterion_code })
                    : tCriteria('generate_aria_label', { code: row.criterion_code })
                }
              >
                <Sparkles />
                {isGenerating ? tCriteria('generating') : tCriteria('generate')}
              </Button>
              {hasAiInfo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onAiInfoClick?.(row)}
                  aria-label={tCriteria('ai_info_aria_label', { code: row.criterion_code })}
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
