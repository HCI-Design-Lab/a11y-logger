'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssuesTable } from '@/components/issues/issues-table';
import type { Issue } from '@/lib/db/issues';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

interface AssessmentIssuesCardProps {
  projectId: string;
  assessmentId: string;
  issues: Issue[];
  selectedSeverity?: string;
}

export function AssessmentIssuesCard({
  projectId,
  assessmentId,
  issues,
  selectedSeverity,
}: AssessmentIssuesCardProps) {
  const router = useRouter();
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}`;

  function handleTabChange(value: string) {
    router.push(value ? `${baseUrl}?severity=${value}` : baseUrl);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Issues ({issues.length})</CardTitle>
        <Tabs value={selectedSeverity ?? ''} onValueChange={handleTabChange}>
          <TabsList variant="segmented">
            <TabsTrigger value="">All</TabsTrigger>
            {SEVERITIES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issues yet.</p>
        ) : (
          <IssuesTable issues={issues} projectId={projectId} assessmentId={assessmentId} />
        )}
      </CardContent>
    </Card>
  );
}
