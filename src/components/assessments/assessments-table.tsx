'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SortableTable } from '@/components/ui/sortable-table';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

const statusConfig = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

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
      render: (row: AssessmentWithCounts) => {
        const s = statusConfig[row.status];
        return <Badge className={s.className}>{s.label}</Badge>;
      },
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
