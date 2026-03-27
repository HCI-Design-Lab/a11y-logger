'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [query, setQuery] = useState('');
  const searchParams = useSearchParams();
  const severity = searchParams.get('severity');

  const afterSeverity =
    severity && SEVERITIES.includes(severity as (typeof SEVERITIES)[number])
      ? issues.filter((i) => i.severity === severity)
      : issues;

  const filtered = query.trim()
    ? afterSeverity.filter((i) => {
        const q = query.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.assessment_name.toLowerCase().includes(q) ||
          i.project_name.toLowerCase().includes(q)
        );
      })
    : afterSeverity;

  return (
    <section aria-labelledby="issues-heading" className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 id="issues-heading" className="text-lg font-semibold">Issues</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="success" size="sm">
            <Link href="/issues/new">
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Link>
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Severity filter + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm flex-wrap">
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

        <div className="flex items-center gap-2">
          <label htmlFor="issues-search" className="sr-only">
            Search issues
          </label>
          <input
            id="issues-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues…"
            className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No issues found.
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
            <AllIssuesTable issues={filtered} />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
