'use client';

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
  onChange: (criteria: CriterionRow[]) => void;
  readOnly?: boolean;
}

const PRINCIPLES = ['Perceivable', 'Operable', 'Understandable', 'Robust'] as const;

export function VpatCriteriaTable({
  criteria,
  onChange,
  readOnly = false,
}: VpatCriteriaTableProps) {
  const updateRow = (criterion_code: string, field: keyof CriterionRow, value: string) => {
    onChange(
      criteria.map((r) => (r.criterion_code === criterion_code ? { ...r, [field]: value } : r))
    );
  };

  return (
    <div className="space-y-8">
      {PRINCIPLES.map((principle) => {
        const rows = criteria.filter((r) => {
          const meta = WCAG_CRITERIA.find((c) => c.criterion === r.criterion_code);
          return meta?.principle === principle;
        });
        if (rows.length === 0) return null;

        return (
          <div key={principle}>
            <h3 className="text-lg font-semibold mb-2">{principle}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Criterion</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-16">Level</TableHead>
                  <TableHead className="w-48">Conformance</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const meta = WCAG_CRITERIA.find((c) => c.criterion === row.criterion_code);
                  // Display value: convert db snake_case to human-readable label
                  const displayConformance =
                    CONFORMANCE_DISPLAY[row.conformance as keyof typeof CONFORMANCE_DISPLAY] ??
                    row.conformance;

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
                                CONFORMANCE_DB_VALUE[v] ?? v
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
