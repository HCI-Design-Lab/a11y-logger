'use client';

import Link from 'next/link';
import { SortableTable } from '@/components/ui/sortable-table';
import { AssessmentStatusBadge } from '@/components/assessments/assessment-status-badge';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

interface AssessmentsTableProps {
  assessments: AssessmentWithCounts[];
  projectId: string;
}

export function AssessmentsTable({ assessments, projectId }: AssessmentsTableProps) {
  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
      render: (row: AssessmentWithCounts) => (
        <Link
          href={`/projects/${projectId}/assessments/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (row: AssessmentWithCounts) => <AssessmentStatusBadge status={row.status} />,
    },
    {
      key: 'issue_count' as const,
      label: 'Issues',
      render: (row: AssessmentWithCounts) => row.issue_count,
    },
  ];

  return (
    <SortableTable
      columns={columns}
      rows={assessments}
      defaultSortKey="name"
      defaultSortDir="desc"
      getKey={(r) => r.id}
      emptyMessage="No assessments yet."
    />
  );
}
