'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WCAG_PRINCIPLES, type WcagPrinciple } from '@/lib/wcag-criteria';
import type { WcagCriteriaCount } from '@/lib/db/dashboard';

const PRINCIPLE_LABELS: Record<WcagPrinciple, string> = {
  perceivable: 'Perceivable',
  operable: 'Operable',
  understandable: 'Understandable',
  robust: 'Robust',
};

export function WcagCriteria() {
  const [principle, setPrinciple] = useState<WcagPrinciple>('perceivable');
  const [rows, setRows] = useState<WcagCriteriaCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: WcagPrinciple) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/wcag-criteria?principle=${p}`);
      const json = await res.json();
      if (json.success) {
        setRows(json.data);
      } else {
        setError('Failed to load WCAG criteria.');
      }
    } catch {
      setError('Failed to load WCAG criteria.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(principle);
  }, [principle, fetchData]);

  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WCAG Criteria</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Filtered by principle</p>
          </div>
          <div className="flex gap-1">
            {WCAG_PRINCIPLES.map((p) => (
              <button
                key={p}
                onClick={() => setPrinciple(p)}
                aria-pressed={principle === p}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  principle === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {PRINCIPLE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No issues logged for {PRINCIPLE_LABELS[principle]} criteria yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground font-mono text-xs w-12 shrink-0 whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="py-2 pr-4 w-48  whitespace-nowrap">{row.name ?? row.code}</td>
                  <td className="py-2 pr-3 text-right font-bold w-8">{row.count}</td>
                  <td className="py-2 w-full">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                        role="progressbar"
                        aria-valuenow={row.count}
                        aria-valuemin={0}
                        aria-valuemax={maxCount}
                        aria-label={`${row.name ?? row.code}: ${row.count} issues`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
