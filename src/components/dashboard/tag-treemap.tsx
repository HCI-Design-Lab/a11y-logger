'use client';
import { useEffect, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from 'next-intl';
import { ChartTableToggle } from './chart-table-toggle';

interface TagEntry {
  tag: string;
  count: number;
}

// Recharts Treemap needs a `size` key
type TreemapEntry = { name: string; size: number };

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function CustomContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, size, index = 0 } = props;
  const color = CHART_COLORS[index % CHART_COLORS.length];
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={4} opacity={0.85} />
      {height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={11}
          fontWeight={500}
        >
          {name}
        </text>
      )}
      {height > 44 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={10}
          opacity={0.8}
        >
          {size}
        </text>
      )}
    </g>
  );
}

export function TagTreemap() {
  const t = useTranslations('dashboard.tag_treemap');
  const [data, setData] = useState<TagEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetch('/api/dashboard/tags')
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

  const total = data.reduce((s, d) => s + d.count, 0);
  const treemapData: TreemapEntry[] = data.map((d) => ({ name: d.tag, size: d.count }));

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
          <ResponsiveContainer width="100%" height={240}>
            <Treemap data={treemapData} dataKey="size" content={<CustomContent />}>
              <Tooltip formatter={(v) => [(v as number) ?? 0, 'Issues']} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && data.length > 0 && view === 'table' && (
        <table className="w-full text-sm">
          <caption className="sr-only">Open issues ranked by tag frequency</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">
                {t('col_tag')}
              </th>
              <th scope="col" className="pb-2 font-medium text-right">
                {t('col_issues')}
              </th>
              <th scope="col" className="pb-2 font-medium text-right">
                {t('col_percent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.tag} className="border-b last:border-0">
                <td className="py-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
                    {row.tag}
                  </span>
                </td>
                <td className="py-2 text-right">{row.count}</td>
                <td className="py-2 text-right">
                  {total > 0 ? Math.round((row.count / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
