'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SortableTable } from '@/components/ui/sortable-table';
import type { AssessmentWithProject } from '@/lib/db/assessments';

const statusConfig = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

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
      render: (row: AssessmentWithProject) => {
        const s = statusConfig[row.status];
        return <Badge className={s.className}>{s.label}</Badge>;
      },
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
