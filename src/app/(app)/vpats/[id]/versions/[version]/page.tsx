'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, ChevronDown, ArrowLeft } from 'lucide-react';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';
import type { VpatSnapshotData } from '@/lib/db/vpat-snapshots';

interface SnapshotResponse {
  version_number: number;
  published_at: string;
  vpat: VpatSnapshotData;
}

export default function VpatVersionPage() {
  const params = useParams<{ id: string; version: string }>();
  const router = useRouter();
  const { id: vpatId, version } = params;

  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [rows, setRows] = useState<VpatCriterionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vpats/${vpatId}/versions/${version}`);
        const json = await res.json();
        if (!json.success) {
          toast.error('Version not found');
          router.push(`/vpats/${vpatId}`);
          return;
        }
        setSnapshot(json.data);
        // Convert snapshot criterion_rows to VpatCriterionRow shape for the table
        const snapshotRows: VpatCriterionRow[] = json.data.vpat.criterion_rows.map(
          (r: VpatSnapshotData['criterion_rows'][0], i: number) => ({
            id: `snap-${i}`,
            vpat_id: vpatId,
            criterion_id: `snap-${i}`,
            criterion_code: r.criterion_code,
            criterion_name: r.criterion_name,
            criterion_description: r.criterion_description,
            criterion_level: r.criterion_level,
            criterion_section: r.criterion_section,
            conformance: r.conformance as VpatCriterionRow['conformance'],
            remarks: r.remarks,
            ai_confidence: null,
            ai_reasoning: null,
            last_generated_at: null,
            updated_at: json.data.published_at,
            issue_count: 0,
          })
        );
        setRows(snapshotRows);
      } catch {
        toast.error('Failed to load version');
        router.push(`/vpats/${vpatId}`);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [vpatId, version, router]);

  if (isLoading) return <div className="text-muted-foreground text-sm p-6">Loading…</div>;
  if (!snapshot) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'VPATs', href: '/vpats' },
          { label: 'VPAT Detail', href: `/vpats/${vpatId}` },
          { label: `Version ${snapshot.version_number}` },
        ]}
      />

      {/* Read-only banner */}
      <div className="flex items-center gap-3 rounded-md border border-muted bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        <span>
          <strong>Version {snapshot.version_number}</strong> — Published{' '}
          {new Date(snapshot.published_at).toLocaleDateString()}
        </span>
        <span>·</span>
        <span>This is a historical snapshot.</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => router.push(`/vpats/${vpatId}`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to current VPAT
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{snapshot.vpat.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">v{snapshot.version_number}</Badge>
            <Badge variant="default">Published</Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/api/vpats/${vpatId}/versions/${version}/export?format=docx`}>
                Word (.docx)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/api/vpats/${vpatId}/versions/${version}/export?format=openacr`}>
                OpenACR (YAML)
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Read-only criteria table */}
      <VpatCriteriaTable
        rows={rows}
        onRowChange={async () => {}}
        onSaveRemarks={async () => {}}
        onGenerateRow={async () => {}}
        onGenerateAll={async () => {}}
        generatingRowId={null}
        readOnly={true}
        aiEnabled={false}
        onCriterionClick={() => {}}
      />
    </div>
  );
}
