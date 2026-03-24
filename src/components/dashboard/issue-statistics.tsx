'use client';

import { useState } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTableToggle } from './chart-table-toggle';

interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface IssueStatisticsProps {
  openTotal: number;
  severityBreakdown: SeverityBreakdown;
}

const SEVERITY_CONFIG = [
  { key: 'critical' as const, label: 'Critical', color: '#ef4444' },
  { key: 'high' as const, label: 'High', color: '#f97316' },
  { key: 'medium' as const, label: 'Medium', color: '#eab308' },
  { key: 'low' as const, label: 'Low', color: '#3b82f6' },
];

export function IssueStatistics({ openTotal, severityBreakdown }: IssueStatisticsProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const pieData = SEVERITY_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: severityBreakdown[key],
    fill: color,
  })).filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Issue Statistics</CardTitle>
        <ChartTableToggle view={view} onChange={setView} />
      </CardHeader>
      <CardContent>
        {view === 'chart' ? (
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
                <span className="text-4xl font-bold">{openTotal}</span>
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
                  <span className="font-bold text-xl">{severityBreakdown[key]}</span>
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
                  <td className="py-2 text-right font-bold">{severityBreakdown[key]}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-medium">Total</td>
                <td className="py-2 text-right font-bold">{openTotal}</td>
              </tr>
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
