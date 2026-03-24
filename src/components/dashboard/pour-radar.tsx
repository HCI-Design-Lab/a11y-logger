// src/components/dashboard/pour-radar.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartTableToggle } from './chart-table-toggle';

interface PourTotals {
  perceivable: number;
  operable: number;
  understandable: number;
  robust: number;
}

const PRINCIPLE_LABELS: Record<keyof PourTotals, string> = {
  perceivable: 'Perceivable',
  operable: 'Operable',
  understandable: 'Understandable',
  robust: 'Robust',
};

export function PourRadar() {
  const [data, setData] = useState<PourTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetch('/api/dashboard/pour-radar')
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((j) => {
        setData(j.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const chartData = data
    ? (Object.keys(PRINCIPLE_LABELS) as Array<keyof PourTotals>).map((key) => ({
        principle: PRINCIPLE_LABELS[key],
        issues: data[key],
      }))
    : [];

  const total = chartData.reduce((s, d) => s + d.issues, 0);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Issues by POUR Principle</h2>
        <ChartTableToggle view={view} onChange={setView} />
      </div>

      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>}
      {error && <p className="text-sm text-destructive py-8 text-center">Failed to load data.</p>}

      {!loading && !error && total === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No open issues found.</p>
      )}

      {!loading && !error && total > 0 && view === 'chart' && (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="principle" tick={{ fontSize: 12 }} />
              <Radar
                dataKey="issues"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.25}
              />
              <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Issues']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && total > 0 && view === 'table' && (
        <table className="w-full text-sm">
          <caption className="sr-only">Issues by POUR Principle — open issues only</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Principle</th>
              <th className="pb-2 font-medium text-right">Issues</th>
              <th className="pb-2 font-medium text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.principle} className="border-b last:border-0">
                <td className="py-2">{row.principle}</td>
                <td className="py-2 text-right">{row.issues}</td>
                <td className="py-2 text-right">
                  {total > 0 ? Math.round((row.issues / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-muted-foreground">
              <td className="pt-2 font-medium">Total</td>
              <td className="pt-2 text-right font-medium">{total}</td>
              <td className="pt-2 text-right text-muted-foreground">100%</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
