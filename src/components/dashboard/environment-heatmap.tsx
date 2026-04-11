'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartTableToggle } from './chart-table-toggle';
import { cn } from '@/lib/utils';

interface EnvironmentEntry {
  device_type: string;
  assistive_technology: string;
  count: number;
}

function heatColor(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-muted';
  const intensity = count / max;
  if (intensity > 0.75) return 'bg-chart-1 text-white';
  if (intensity > 0.5) return 'bg-chart-1/70 text-foreground';
  if (intensity > 0.25) return 'bg-chart-1/40 text-foreground';
  return 'bg-chart-1/15 text-foreground';
}

export function EnvironmentHeatmap() {
  const t = useTranslations('dashboard.environment_heatmap');
  const [data, setData] = useState<EnvironmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetch('/api/dashboard/environment')
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

  const devices = [...new Set(data.map((d) => d.device_type))].sort();
  const ats = [...new Set(data.map((d) => d.assistive_technology))].sort();
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  const getCount = (device: string, at: string) =>
    data.find((d) => d.device_type === device && d.assistive_technology === at)?.count ?? 0;

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

      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">
              {view === 'chart' ? t('caption_heatmap') : t('caption_table')}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="pb-2 pr-3 text-left text-xs text-muted-foreground font-medium"
                >
                  {t('col_device')}
                </th>
                {ats.map((at) => (
                  <th
                    key={at}
                    scope="col"
                    className="pb-2 px-2 text-xs text-muted-foreground font-medium text-center"
                  >
                    {at}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device}>
                  <td className="py-1 pr-3 text-xs font-medium capitalize">{device}</td>
                  {ats.map((at) => {
                    const count = getCount(device, at);
                    return (
                      <td
                        key={at}
                        className={cn(
                          'py-1 px-2 text-center text-xs rounded',
                          view === 'chart' ? heatColor(count, maxCount) : ''
                        )}
                        aria-label={`${device}, ${at}: ${count} issue${count !== 1 ? 's' : ''}`}
                      >
                        {count > 0 ? count : view === 'chart' ? '·' : '0'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
