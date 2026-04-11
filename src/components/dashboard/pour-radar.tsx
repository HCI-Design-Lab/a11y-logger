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
import { useTranslations } from 'next-intl';
import { ChartTableToggle } from './chart-table-toggle';

interface PourTotals {
  perceivable: number;
  operable: number;
  understandable: number;
  robust: number;
}

interface PourRadarProps {
  statuses: string[];
}

export function PourRadar({ statuses }: PourRadarProps) {
  const t = useTranslations('dashboard.pour_radar');

  const PRINCIPLE_LABELS: Record<keyof PourTotals, string> = {
    perceivable: t('principle_perceivable'),
    operable: t('principle_operable'),
    understandable: t('principle_understandable'),
    robust: t('principle_robust'),
  };

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
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <ChartTableToggle view={view} onChange={setView} />
      </div>

      {loading && !data && (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('loading')}</p>
      )}
      {error && !data && <p className="text-sm text-destructive py-8 text-center">{t('error')}</p>}

      {data && (
        <div
          className={`flex flex-col flex-1 min-h-0${loading ? ' opacity-50 pointer-events-none' : ''}`}
        >
          {total === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('empty')}</p>
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
                  <Tooltip formatter={(v) => [(v as number) ?? 0, t('col_issues')]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">{t('caption')}</caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">{t('col_principle')}</th>
                  <th className="pb-2 font-medium text-right">{t('col_issues')}</th>
                  <th className="pb-2 font-medium text-right">{t('col_percent')}</th>
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
                  <td className="pt-2 font-medium">{t('row_total')}</td>
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
