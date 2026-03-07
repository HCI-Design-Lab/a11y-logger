'use client';

import Link from 'next/link';
import { SortableTable } from '@/components/ui/sortable-table';
import { SeverityBadge } from '@/components/issues/severity-badge';
import type { Issue } from '@/lib/db/issues';

const statusLabels: Record<string, string> = {
  open: 'Open',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface IssuesTableProps {
  issues: Issue[];
  projectId: string;
  assessmentId: string;
}

export function IssuesTable({ issues, projectId, assessmentId }: IssuesTableProps) {
  const columns = [
    {
      key: 'title' as const,
      label: 'Title',
      render: (row: Issue) => (
        <Link
          href={`/projects/${projectId}/assessments/${assessmentId}/issues/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'severity' as const,
      label: 'Severity',
      render: (row: Issue) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (row: Issue) => statusLabels[row.status] ?? row.status,
    },
    {
      key: 'created_at' as const,
      label: 'Created',
      render: (row: Issue) => (
        <span className="text-muted-foreground">{formatDate(row.created_at)}</span>
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
