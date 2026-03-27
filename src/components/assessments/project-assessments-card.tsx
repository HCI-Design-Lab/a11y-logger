'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentsTable } from '@/components/assessments/assessments-table';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

interface ProjectAssessmentsCardProps {
  projectId: string;
  projectName: string;
  assessments: AssessmentWithCounts[];
}

export function ProjectAssessmentsCard({ projectId, assessments }: ProjectAssessmentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments yet.</p>
        ) : (
          <AssessmentsTable assessments={assessments} projectId={projectId} />
        )}
      </CardContent>
    </Card>
  );
}
