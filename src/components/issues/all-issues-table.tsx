'use client';

import Link from 'next/link';
import { SortableTable } from '@/components/ui/sortable-table';
import { SeverityBadge } from '@/components/issues/severity-badge';
import { StatusBadge } from '@/components/issues/status-badge';
import type { IssueWithContext } from '@/lib/db/issues';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface AllIssuesTableProps {
  issues: IssueWithContext[];
}

export function AllIssuesTable({ issues }: AllIssuesTableProps) {
  const columns = [
    {
      key: 'title' as const,
      label: 'Title',
      render: (row: IssueWithContext) => (
        <Link
          href={`/projects/${row.project_id}/assessments/${row.assessment_id}/issues/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'severity' as const,
      label: 'Severity',
      render: (row: IssueWithContext) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (row: IssueWithContext) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at' as const,
      label: 'Created',
      render: (row: IssueWithContext) => (
        <span className="text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'project_name' as const,
      label: 'Project',
      render: (row: IssueWithContext) => (
        <Link
          href={`/projects/${row.project_id}`}
          className="hover:underline text-muted-foreground block truncate max-w-[160px]"
          title={row.project_name}
        >
          {row.project_name}
        </Link>
      ),
    },
    {
      key: 'assessment_name' as const,
      label: 'Assessment',
      render: (row: IssueWithContext) => (
        <Link
          href={`/projects/${row.project_id}/assessments/${row.assessment_id}`}
          className="hover:underline text-muted-foreground block truncate max-w-[160px]"
          title={row.assessment_name}
        >
          {row.assessment_name}
        </Link>
      ),
    },
  ];

  return (
    <SortableTable
      columns={columns}
      rows={issues}
      defaultSortKey="created_at"
      defaultSortDir="desc"
      getKey={(r) => r.id}
      emptyMessage="No issues yet."
    />
  );
}
