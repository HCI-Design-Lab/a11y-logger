'use client';

import Link from 'next/link';
import { SortableTable } from '@/components/ui/sortable-table';
import type { ProjectWithCounts } from '@/lib/db/projects';

interface ProjectsTableProps {
  projects: ProjectWithCounts[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
      render: (row: ProjectWithCounts) => (
        <Link href={`/projects/${row.id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'description' as const,
      label: 'Description',
      render: (row: ProjectWithCounts) => (
        <span className="text-muted-foreground text-sm line-clamp-1">{row.description ?? '—'}</span>
      ),
    },
    {
      key: 'assessment_count' as const,
      label: 'Assessments',
      render: (row: ProjectWithCounts) => row.assessment_count,
    },
    {
      key: 'issue_count' as const,
      label: 'Issues',
      render: (row: ProjectWithCounts) => row.issue_count,
    },
  ];

  return (
    <SortableTable
      columns={columns}
      rows={projects}
      defaultSortKey="name"
      defaultSortDir="asc"
      getKey={(r) => r.id}
      emptyMessage="No projects yet."
    />
  );
}
