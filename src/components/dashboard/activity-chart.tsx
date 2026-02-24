'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimeRange, TimeSeriesEntry } from '@/lib/db/dashboard';

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '6 months', value: '6m' },
  { label: '3 months', value: '3m' },
  { label: '1 month', value: '1m' },
  { label: '1 week', value: '1w' },
];

export function ActivityChart() {
  const [range, setRange] = useState<TimeRange>('6m');
  const [data, setData] = useState<TimeSeriesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/timeseries?range=${r}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError('Failed to load chart data.');
      }
    } catch {
      setError('Failed to load chart data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipLabel = (label: unknown) => {
    if (typeof label === 'string') return formatDate(label);
    return String(label ?? '');
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Projects, Assessments, and Issues</CardTitle>
          {data.length > 0 && data[0] && data[data.length - 1] && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(data[0].date)} – {formatDate(data[data.length - 1]!.date)}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                range === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No activity in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Projects"
              />
              <Line
                type="monotone"
                dataKey="assessments"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Assessments"
              />
              <Line
                type="monotone"
                dataKey="issues"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Issues"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
