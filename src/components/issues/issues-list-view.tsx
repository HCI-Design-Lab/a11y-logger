'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AllIssuesTable } from '@/components/issues/all-issues-table';
import { IssueCard } from '@/components/issues/issue-card';
import type { IssueWithContext } from '@/lib/db/issues';

interface IssuesListViewProps {
  issues: IssueWithContext[];
}

export function IssuesListView({ issues }: IssuesListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {issues.map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <AllIssuesTable issues={issues} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
