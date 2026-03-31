'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { SortableTable } from '@/components/ui/sortable-table';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

interface SnapshotSummary {
  id: string;
  vpat_id: string;
  version_number: number;
  published_at: string;
  created_at: string;
}

interface VpatVersionHistoryTableProps {
  vpatId: string;
  snapshots: SnapshotSummary[];
}

export function VpatVersionHistoryTable({ vpatId, snapshots }: VpatVersionHistoryTableProps) {
  const columns = [
    {
      key: 'version_number' as const,
      label: 'Version',
      render: (row: SnapshotSummary) => (
        <Link
          href={`/vpats/${vpatId}/versions/${row.version_number}`}
          className="font-medium hover:underline"
        >
          v{row.version_number}
        </Link>
      ),
    },
    {
      key: 'published_at' as const,
      label: 'Published',
      render: (row: SnapshotSummary) => (
        <span className="text-muted-foreground">{formatDate(row.published_at)}</span>
      ),
    },
    {
      key: 'created_at' as const,
      label: 'Created At',
      render: (row: SnapshotSummary) => (
        <span className="text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published versions yet. Publish this VPAT to create a snapshot.
          </p>
        ) : (
          <SortableTable
            columns={columns}
            rows={snapshots}
            defaultSortKey="version_number"
            defaultSortDir="desc"
            getKey={(r) => r.id}
            emptyMessage="No published versions yet. Publish this VPAT to create a snapshot."
          />
        )}
      </CardContent>
    </Card>
  );
}
