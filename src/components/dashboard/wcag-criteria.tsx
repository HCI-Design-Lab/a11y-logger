'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WCAG_PRINCIPLES, type WcagPrinciple } from '@/lib/wcag-criteria';
import type { WcagCriteriaCount } from '@/lib/db/dashboard';

interface WcagCriteriaProps {
  statuses: string[];
}

export function WcagCriteria({ statuses }: WcagCriteriaProps) {
  const t = useTranslations('dashboard.wcag_criteria');
  const tp = useTranslations('dashboard.pour_radar');

  const PRINCIPLE_LABELS: Record<WcagPrinciple, string> = {
    perceivable: tp('principle_perceivable'),
    operable: tp('principle_operable'),
    understandable: tp('principle_understandable'),
    robust: tp('principle_robust'),
  };

  const [principle, setPrinciple] = useState<WcagPrinciple>('perceivable');
  const [rows, setRows] = useState<WcagCriteriaCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusesKey = statuses.join(',');

  const fetchData = useCallback(
    async (p: WcagPrinciple) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/dashboard/wcag-criteria?principle=${p}&statuses=${statusesKey}`
        );
        const json = await res.json();
        if (json.success) {
          setRows(json.data);
        } else {
          setError(t('error'));
        }
      } catch {
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    },
    [statusesKey, t]
  );

  useEffect(() => {
    fetchData(principle);
  }, [principle, fetchData]);

  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t('subtitle')}</p>
          </div>
          <Tabs value={principle} onValueChange={(v) => setPrinciple(v as WcagPrinciple)}>
            <TabsList variant="segmented">
              {WCAG_PRINCIPLES.map((p) => (
                <TabsTrigger key={p} value={p}>
                  {PRINCIPLE_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">{t('loading')}</p>
        )}
        {!loading && error && rows.length === 0 && (
          <p className="text-sm text-destructive py-4">{error}</p>
        )}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {t('empty', { principle: PRINCIPLE_LABELS[principle] })}
          </p>
        )}
        {rows.length > 0 && (
          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.code} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground font-mono text-xs w-12 shrink-0 whitespace-nowrap">
                      {row.code}
                    </td>
                    <td className="py-2 pr-4 w-48  whitespace-nowrap">{row.name ?? row.code}</td>
                    <td className="py-2 pr-3 text-right font-bold w-8">{row.count}</td>
                    <td className="py-2 w-full">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(row.count / maxCount) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={row.count}
                          aria-valuemin={0}
                          aria-valuemax={maxCount}
                          aria-label={`${row.name ?? row.code}: ${row.count} issues`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
