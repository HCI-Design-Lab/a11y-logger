'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ChartTableToggle } from './chart-table-toggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * bucketData — Collapses daily time-series entries into weekly buckets for
 * ranges longer than one month, keeping the chart readable at scale.
 *
 * Short ranges (1w / 1m) are returned as-is (daily granularity), trimmed to
 * the most recent 20 data points so the chart never renders more lines than
 * the viewport can comfortably display.
 */
function bucketData(data: TimeSeriesEntry[], range: string): TimeSeriesEntry[] {
  if (range === '1m' || range === '1w') return data.slice(-20);
  // Group by week for longer ranges
  const weeks = new Map<string, TimeSeriesEntry>();
  for (const entry of data) {
    const d = new Date(entry.date);
    // Normalise to Monday of the same week so each bucket has a stable key
    // regardless of which day within the week the entry falls on.
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekKey = d.toISOString().slice(0, 10);
    const existing = weeks.get(weekKey);
    if (existing) {
      existing.projects += entry.projects;
      existing.assessments += entry.assessments;
      existing.issues += entry.issues;
    } else {
      weeks.set(weekKey, {
        date: weekKey,
        projects: entry.projects,
        assessments: entry.assessments,
        issues: entry.issues,
      });
    }
  }
  return Array.from(weeks.values()).slice(-20);
}

/**
 * formatDate — Converts an ISO date string to a short locale label for axis
 * ticks and tooltips (e.g. "Jan 5").
 *
 * The 'T00:00:00' suffix forces the Date constructor to treat the string as
 * local midnight rather than UTC midnight, preventing off-by-one day errors
 * in timezones west of UTC.
 */
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface LegendPayloadEntry {
  value: string;
  color: string;
}

function ActivityLegend({ payload }: { payload?: LegendPayloadEntry[] }) {
  if (!payload?.length) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 16, marginTop: 8 }}>
      {payload.map((entry) => (
        <div key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'var(--foreground)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 16,
        color: 'var(--foreground)',
      }}
    >
      <p style={{ marginBottom: 4, fontWeight: 500 }}>{formatDate(label ?? '')}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span>
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '6 months', value: '6m' },
  { label: '3 months', value: '3m' },
  { label: '1 month', value: '1m' },
  { label: '1 week', value: '1w' },
];

/**
 * ActivityChart — Dashboard card showing projects, assessments, and issues
 * created over time as an interactive line chart or accessible data table.
 *
 * Data is fetched client-side on mount and whenever the user changes the time
 * range. The raw daily series from the API is passed through `bucketData` for
 * the table view (weekly buckets on longer ranges) while the Recharts line
 * chart always receives the full daily series for smoother curves.
 *
 * The chart and table views share the same fetched data — toggling between
 * them does not trigger a new network request.
 *
 * Custom `ActivityTooltip` and `ActivityLegend` components are used instead
 * of Recharts defaults so colours and fonts respect the app's CSS variables
 * (`--foreground`, `--border`, `--card`) rather than being hard-coded.
 */
export function ActivityChart() {
  const [range, setRange] = useState<TimeRange>('6m');
  const [view, setView] = useState<'chart' | 'table'>('chart');
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

  // Pre-bucket the data for the table view; memoised so switching between
  // chart and table does not re-run the aggregation on every render.
  const tableData = useMemo(() => bucketData(data, range), [data, range]);

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
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList variant="segmented">
              {RANGES.map(({ label, value }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <ChartTableToggle view={view} onChange={setView} />
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
          <>
            {view === 'chart' && (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} allowDecimals={false} />
                  <Tooltip content={<ActivityTooltip />} />
                  <Legend content={<ActivityLegend />} />
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
            {view === 'table' && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Showing most recent {tableData.length}{' '}
                  {range !== '1m' && range !== '1w' ? 'weeks' : 'days'}
                </p>
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Projects, assessments, and issues created over time
                  </caption>
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th scope="col" className="pb-2 font-medium">
                        Date
                      </th>
                      <th scope="col" className="pb-2 font-medium text-right">
                        Projects
                      </th>
                      <th scope="col" className="pb-2 font-medium text-right">
                        Assessments
                      </th>
                      <th scope="col" className="pb-2 font-medium text-right">
                        Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.date} className="border-b last:border-0">
                        <td className="py-1.5">{row.date}</td>
                        <td className="py-1.5 text-right">{row.projects}</td>
                        <td className="py-1.5 text-right">{row.assessments}</td>
                        <td className="py-1.5 text-right">{row.issues}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
