'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Table2 } from 'lucide-react';

interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface IssueStatisticsProps {
  total: number;
  severityBreakdown: SeverityBreakdown;
}

const SEVERITY_CONFIG = [
  { key: 'critical' as const, label: 'Critical', color: '#ef4444' },
  { key: 'high' as const, label: 'High', color: '#f97316' },
  { key: 'medium' as const, label: 'Medium', color: '#eab308' },
  { key: 'low' as const, label: 'Low', color: '#3b82f6' },
];

export function IssueStatistics({ total, severityBreakdown }: IssueStatisticsProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const pieData = SEVERITY_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: severityBreakdown[key],
    color,
  })).filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Issue Statistics</CardTitle>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('chart')}
            aria-label="Chart view"
            aria-pressed={view === 'chart'}
            className={`p-1.5 rounded transition-colors ${
              view === 'chart'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            aria-label="Table view"
            aria-pressed={view === 'table'}
            className={`p-1.5 rounded transition-colors ${
              view === 'table'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Table2 size={16} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'chart' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full mb-8" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    strokeWidth={5}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} style={{ stroke: 'var(--card)' }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Issues']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold">{total}</span>
                <span className="text-sm text-muted-foreground">Total</span>
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
                <td className="py-2 text-right font-bold">{total}</td>
              </tr>
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
