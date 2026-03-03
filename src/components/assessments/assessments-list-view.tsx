'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AllAssessmentsTable } from '@/components/assessments/all-assessments-table';
import { AssessmentCard } from '@/components/assessments/assessment-card';
import type { AssessmentWithProject } from '@/lib/db/assessments';

interface AssessmentsListViewProps {
  assessments: AssessmentWithProject[];
}

export function AssessmentsListView({ assessments }: AssessmentsListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {assessments.map((a) => (
            <AssessmentCard key={a.id} assessment={a} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <AllAssessmentsTable assessments={assessments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
