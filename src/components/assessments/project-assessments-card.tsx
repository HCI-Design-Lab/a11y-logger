'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AssessmentCard } from '@/components/assessments/assessment-card';
import { AssessmentsTable } from '@/components/assessments/assessments-table';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

interface ProjectAssessmentsCardProps {
  projectId: string;
  projectName: string;
  assessments: AssessmentWithCounts[];
}

export function ProjectAssessmentsCard({
  projectId,
  projectName,
  assessments,
}: ProjectAssessmentsCardProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assessments</CardTitle>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <Button asChild size="sm">
            <Link href={`/projects/${projectId}/assessments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments yet.</p>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assessments.map((a) => (
              <AssessmentCard key={a.id} assessment={a} projectName={projectName} />
            ))}
          </div>
        ) : (
          <AssessmentsTable assessments={assessments} projectId={projectId} />
        )}
      </CardContent>
    </Card>
  );
}
