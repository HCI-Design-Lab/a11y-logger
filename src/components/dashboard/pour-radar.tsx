// src/components/dashboard/pour-radar.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
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

interface PourRadarProps {
  statuses: string[];
}

export function PourRadar({ statuses }: PourRadarProps) {
  const [data, setData] = useState<PourTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const statusesKey = statuses.join(',');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(`/api/dashboard/pour-radar?statuses=${statusesKey}`);
      if (!r.ok) throw new Error(r.statusText);
      const j = await r.json();
      setData(j.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [statusesKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = data
    ? (Object.keys(PRINCIPLE_LABELS) as Array<keyof PourTotals>).map((key) => ({
        principle: PRINCIPLE_LABELS[key],
        issues: data[key],
      }))
    : [];

  const total = chartData.reduce((s, d) => s + d.issues, 0);

  return (
    <div className="rounded-lg border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Issues by POUR Principle</h2>
        <ChartTableToggle view={view} onChange={setView} />
      </div>

      {loading && !data && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}
      {error && !data && (
        <p className="text-sm text-destructive py-8 text-center">Failed to load data.</p>
      )}

      {data && (
        <div
          className={`flex flex-col flex-1 min-h-0${loading ? ' opacity-50 pointer-events-none' : ''}`}
        >
          {total === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No open issues found.</p>
          ) : view === 'chart' ? (
            <div aria-hidden="true" inert className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
                  <PolarAngleAxis
                    dataKey="principle"
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                  />
                  <Radar
                    dataKey="issues"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.65}
                  />
                  <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Issues']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
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
      )}
    </div>
  );
}
