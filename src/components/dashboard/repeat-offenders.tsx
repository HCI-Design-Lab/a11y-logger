// src/components/dashboard/repeat-offenders.tsx
'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslations } from 'next-intl';
import { ChartTableToggle } from './chart-table-toggle';

interface RepeatOffender {
  code: string;
  name?: string;
  project_count: number;
  issue_count: number;
}

export function RepeatOffenders() {
  const t = useTranslations('dashboard.repeat_offenders');
  const [data, setData] = useState<RepeatOffender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetch('/api/dashboard/repeat-offenders')
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((j) => {
        setData(j.data.slice(0, 10));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const chartData = data.map((d) => ({
    label: d.code,
    projects: d.project_count,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        <ChartTableToggle view={view} onChange={setView} />
      </div>

      {loading && <p className="text-sm text-muted-foreground py-8 text-center">{t('loading')}</p>}
      {error && <p className="text-sm text-destructive py-8 text-center">{t('error')}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('empty')}</p>
      )}

      {!loading && !error && data.length > 0 && view === 'chart' && (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => [(v as number) ?? 0, t('tooltip_projects')]} />
              <Bar dataKey="projects" radius={[0, 3, 3, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={_.label} fill={`var(--chart-1)`} opacity={1 - i * 0.07} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && data.length > 0 && view === 'table' && (
        <table className="w-full text-sm">
          <caption className="sr-only">
            WCAG criteria ranked by number of projects affected — open issues only
          </caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">
                {t('col_code')}
              </th>
              <th scope="col" className="pb-2 font-medium">
                {t('col_criterion')}
              </th>
              <th scope="col" className="pb-2 font-medium text-right">
                {t('col_projects')}
              </th>
              <th scope="col" className="pb-2 font-medium text-right">
                {t('col_issues')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.code} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{row.code}</td>
                <td className="py-2 text-muted-foreground">{row.name ?? row.code}</td>
                <td className="py-2 text-right">{row.project_count}</td>
                <td className="py-2 text-right">{row.issue_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
