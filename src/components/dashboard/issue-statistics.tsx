'use client';

import { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTableToggle } from './chart-table-toggle';

interface IssueStatisticsProps {
  statuses: string[];
}

interface FetchedData {
  breakdown: { critical: number; high: number; medium: number; low: number };
  total: number;
}

const SEVERITY_CONFIG = [
  { key: 'critical' as const, label: 'Critical', color: '#ef4444' },
  { key: 'high' as const, label: 'High', color: '#f97316' },
  { key: 'medium' as const, label: 'Medium', color: '#eab308' },
  { key: 'low' as const, label: 'Low', color: '#3b82f6' },
];

export function IssueStatistics({ statuses }: IssueStatisticsProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const statusesKey = statuses.join(',');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/dashboard/issue-statistics?statuses=${statusesKey}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((j) => {
        setFetchedData(j.data);
        setResolvedKey(statusesKey);
        setError(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(true);
        setResolvedKey(statusesKey);
      });
    return () => {
      controller.abort();
    };
  }, [statusesKey]);

  const loading = resolvedKey !== statusesKey;

  const total = fetchedData?.total ?? 0;

  const pieData = SEVERITY_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: fetchedData?.breakdown[key] ?? 0,
    fill: color,
  })).filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Issue Statistics</CardTitle>
        <ChartTableToggle view={view} onChange={setView} />
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>}
        {!loading && error && (
          <p className="text-sm text-destructive py-8 text-center">Failed to load data.</p>
        )}
        {!loading &&
          !error &&
          (view === 'chart' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full mb-8" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      strokeWidth={5}
                      stroke="var(--card)"
                    />
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Issues']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-bold">{total}</span>
                  <span className="text-sm text-muted-foreground">Open</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 w-full text-center">
                {SEVERITY_CONFIG.map(({ key, label, color }) => (
                  <div key={key} className="flex flex-col items-center gap-0.5">
                    <span
                      className="inline-block w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground text-sm">{label}</span>
                    <span className="font-bold text-xl">{fetchedData?.breakdown[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 font-medium text-muted-foreground">Severity</th>
                  <th className="text-right py-1.5 font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {SEVERITY_CONFIG.map(({ key, label, color }) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </span>
                    </td>
                    <td className="py-2 text-right font-bold">
                      {fetchedData?.breakdown[key] ?? 0}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-medium">Total</td>
                  <td className="py-2 text-right font-bold">{total}</td>
                </tr>
              </tbody>
            </table>
          ))}
      </CardContent>
    </Card>
  );
}
