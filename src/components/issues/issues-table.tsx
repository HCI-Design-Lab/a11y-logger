'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SortableTable } from '@/components/ui/sortable-table';
import type { Issue } from '@/lib/db/issues';

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
      render: (row: Issue) => {
        const sev = severityConfig[row.severity];
        return <Badge className={sev.className}>{sev.label}</Badge>;
      },
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
      rows={issues as unknown as Record<string, unknown>[]}
      defaultSortKey="created_at"
      defaultSortDir="desc"
      getKey={(r) => r.id as string}
      emptyMessage="No issues yet."
    />
  );
}
