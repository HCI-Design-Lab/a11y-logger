'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <main className="p-6 space-y-6">
      <section aria-labelledby="assessments-heading">
        <div className="flex items-center justify-between">
          <h1 id="assessments-heading" className="text-lg font-semibold">
            Assessments
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="success">
              <Link href="/assessments/new">
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Link>
            </Button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </section>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No assessments yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/assessments/new">Create your first assessment</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
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
    </main>
  );
}
