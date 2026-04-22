'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AllIssuesTable } from '@/components/issues/all-issues-table';
import { IssueCard } from '@/components/issues/issue-card';
import type { IssueWithContext } from '@/lib/db/issues';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

interface IssuesListViewProps {
  issues: IssueWithContext[];
}

export function IssuesListView({ issues }: IssuesListViewProps) {
  const t = useTranslations('issues.list');
  const tSeverity = useTranslations('issues.badge.severity');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const severity = searchParams.get('severity');
  const status = searchParams.get('status') as 'open' | 'resolved' | 'wont_fix' | null;

  function handleSeverityChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('severity', value);
    } else {
      params.delete('severity');
    }
    router.push(params.size > 0 ? `/issues?${params.toString()}` : '/issues');
  }

  const afterSeverity =
    severity && SEVERITIES.includes(severity as (typeof SEVERITIES)[number])
      ? issues.filter((i) => i.severity === severity)
      : issues;

  const afterStatus =
    status && (['open', 'resolved', 'wont_fix'] as const).includes(status)
      ? afterSeverity.filter((i) => i.status === status)
      : afterSeverity;

  const filtered = query.trim()
    ? afterStatus.filter((i) => {
        const q = query.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.assessment_name.toLowerCase().includes(q) ||
          i.project_name.toLowerCase().includes(q)
        );
      })
    : afterStatus;

  return (
    <section aria-labelledby="issues-heading" className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 id="issues-heading" className="text-lg font-semibold">
          {t('page_title')}
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="success" size="sm">
            <Link href="/issues/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new_button')}
            </Link>
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === 'grid' && (
        /* Severity filter + Search — grid view only; in table view these live inside the card */
        <div className="flex items-center justify-between gap-4">
          <Tabs value={severity ?? ''} onValueChange={handleSeverityChange}>
            <TabsList variant="segmented">
              <TabsTrigger value="">{t('all_tab')}</TabsTrigger>
              {SEVERITIES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {tSeverity(s)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <label htmlFor="issues-search" className="sr-only">
              {t('search_label')}
            </label>
            <Input
              id="issues-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-56"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 && view === 'grid' ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t('no_results')}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {filtered.map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            {/* Severity filter + Search — inside card in table view */}
            <div className="flex items-center justify-between gap-4 pb-4">
              <Tabs value={severity ?? ''} onValueChange={handleSeverityChange}>
                <TabsList variant="segmented">
                  <TabsTrigger value="">{t('all_tab')}</TabsTrigger>
                  {SEVERITIES.map((s) => (
                    <TabsTrigger key={s} value={s}>
                      {tSeverity(s)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <label htmlFor="issues-search" className="sr-only">
                  {t('search_label')}
                </label>
                <Input
                  id="issues-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-56"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                {t('no_results')}
              </div>
            ) : (
              <AllIssuesTable issues={filtered} />
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
