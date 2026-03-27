'use client';

import Link from 'next/link';
import { SortableTable } from '@/components/ui/sortable-table';
import { AssessmentStatusBadge } from '@/components/assessments/assessment-status-badge';
import type { AssessmentWithProject } from '@/lib/db/assessments';

interface AllAssessmentsTableProps {
  assessments: AssessmentWithProject[];
}

export function AllAssessmentsTable({ assessments }: AllAssessmentsTableProps) {
  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
      render: (row: AssessmentWithProject) => (
        <Link
          href={`/projects/${row.project_id}/assessments/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'project_name' as const,
      label: 'Project',
      render: (row: AssessmentWithProject) => (
        <Link
          href={`/projects/${row.project_id}`}
          className="hover:underline text-muted-foreground"
        >
          {row.project_name}
        </Link>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (row: AssessmentWithProject) => <AssessmentStatusBadge status={row.status} />,
    },
    {
      key: 'issue_count' as const,
      label: 'Issues',
      render: (row: AssessmentWithProject) => row.issue_count,
    },
  ];

  return (
    <SortableTable
      columns={columns}
      rows={assessments}
      defaultSortKey="created_at"
      defaultSortDir="desc"
      getKey={(r) => r.id}
      emptyMessage="No assessments yet."
    />
  );
}
