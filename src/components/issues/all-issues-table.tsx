'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SortableTable } from '@/components/ui/sortable-table';
import type { IssueWithContext } from '@/lib/db/issues';

const severityConfig = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-blue-100 text-blue-700' },
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

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
      key: 'project_name' as const,
      label: 'Project',
      render: (row: IssueWithContext) => (
        <Link
          href={`/projects/${row.project_id}`}
          className="hover:underline text-muted-foreground"
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
          className="hover:underline text-muted-foreground"
        >
          {row.assessment_name}
        </Link>
      ),
    },
    {
      key: 'severity' as const,
      label: 'Severity',
      render: (row: IssueWithContext) => {
        const sev = severityConfig[row.severity];
        return <Badge className={sev.className}>{sev.label}</Badge>;
      },
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (row: IssueWithContext) => statusLabels[row.status] ?? row.status,
    },
    {
      key: 'created_at' as const,
      label: 'Created',
      render: (row: IssueWithContext) => (
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
