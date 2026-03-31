'use client';
import { useState } from 'react';
import { IssueStatistics } from './issue-statistics';
import { PourRadar } from './pour-radar';
import { WcagCriteria } from './wcag-criteria';
import { StatusFilter } from './status-filter';

export function IssueAnalysisSection() {
  const [statuses, setStatuses] = useState<string[]>(['open']);

  return (
    <section aria-labelledby="analysis-heading" className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="analysis-heading" className="text-lg font-semibold">
            Issue Analysis
          </h2>
          <p className="text-sm text-muted-foreground">Issues across all projects</p>
        </div>
        <StatusFilter statuses={statuses} onChange={setStatuses} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <IssueStatistics statuses={statuses} />
        <div className="lg:col-span-2 h-full">
          <PourRadar statuses={statuses} />
        </div>
      </div>
      <div className="mb-4">
        <WcagCriteria statuses={statuses} />
      </div>
    </section>
  );
}
