'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AllIssuesTable } from '@/components/issues/all-issues-table';
import { IssueCard } from '@/components/issues/issue-card';
import type { IssueWithContext } from '@/lib/db/issues';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

interface IssuesListViewProps {
  issues: IssueWithContext[];
}

export function IssuesListView({ issues }: IssuesListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');
  const searchParams = useSearchParams();
  const severity = searchParams.get('severity');

  const filtered =
    severity && SEVERITIES.includes(severity as (typeof SEVERITIES)[number])
      ? issues.filter((i) => i.severity === severity)
      : issues;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filter by severity:</span>
        <Link
          href="/issues"
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            !severity
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          All
        </Link>
        {SEVERITIES.map((s) => (
          <Link
            key={s}
            href={`/issues?severity=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              severity === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {filtered.map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <AllIssuesTable issues={filtered} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
