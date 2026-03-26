'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assessments</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/assessments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
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
