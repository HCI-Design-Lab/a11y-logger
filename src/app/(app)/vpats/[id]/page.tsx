'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { VpatIssuesPanel, type PanelIssue } from '@/components/vpats/vpat-issues-panel';
import { DeleteVpatButton } from '@/components/vpats/delete-vpat-button';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

interface VpatData {
  id: string;
  title: string;
  status: 'draft' | 'published';
  standard_edition: 'WCAG' | '508' | 'EU' | 'INT';
  wcag_version: '2.1' | '2.2';
  wcag_level: 'A' | 'AA' | 'AAA';
  product_scope: string[];
  project_id: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  criterion_rows: VpatCriterionRow[];
}

function getEditionBadgeLabel(vpat: VpatData): string {
  if (vpat.standard_edition === '508') return 'Section 508';
  if (vpat.standard_edition === 'EU') return 'EN 301 549';
  if (vpat.standard_edition === 'INT') return 'International';
  return `WCAG ${vpat.wcag_version} · ${vpat.wcag_level}`;
}

export default function VpatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vpatId = params.id;

  const [vpat, setVpat] = useState<VpatData | null>(null);
  const [rows, setRows] = useState<VpatCriterionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatingRowId, setGeneratingRowId] = useState<string | null>(null);
  const [panelRowCode, setPanelRowCode] = useState<string | null>(null);
  const [panelIssues, setPanelIssues] = useState<PanelIssue[]>([]);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vpats/${vpatId}`);
        const json = await res.json();
        if (!json.success) {
          toast.error('Failed to load VPAT');
          router.push('/vpats');
          return;
        }
        setVpat(json.data);
        setRows(json.data.criterion_rows);
      } catch {
        toast.error('Failed to load VPAT');
        router.push('/vpats');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [vpatId, router]);

  const handleRowChange = useCallback(
    (rowId: string, update: { conformance?: string; remarks?: string }) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? ({ ...r, ...update } as VpatCriterionRow) : r))
      );

      // Debounced save
      const existing = saveTimers.current.get(rowId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/vpats/${vpatId}/rows/${rowId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });
          const json = await res.json();
          if (!json.success) toast.error(json.error ?? 'Failed to save');
        } catch {
          toast.error('Failed to save');
        }
      }, 500);
      saveTimers.current.set(rowId, timer);
    },
    [vpatId]
  );

  const handleGenerateRow = useCallback(
    async (rowId: string) => {
      setGeneratingRowId(rowId);
      try {
        const res = await fetch(`/api/vpats/${vpatId}/rows/${rowId}/generate`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.error ?? 'AI generation failed');
          return;
        }
        setRows((prev) => prev.map((r) => (r.id === rowId ? json.data : r)));
      } catch {
        toast.error('AI generation failed');
      } finally {
        setGeneratingRowId(null);
      }
    },
    [vpatId]
  );

  const handleGenerateAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/vpats/${vpatId}/rows/generate-all`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error('AI generation failed');
        return;
      }
      // Reload rows
      const reloadRes = await fetch(`/api/vpats/${vpatId}`);
      const reloadJson = await reloadRes.json();
      if (reloadJson.success) setRows(reloadJson.data.criterion_rows);
      toast.success(`Generated ${json.data.generated} criteria`);
    } catch {
      toast.error('AI generation failed');
    }
  }, [vpatId]);

  const handleCriterionClick = useCallback(
    async (criterionCode: string) => {
      if (!vpat) return;
      setPanelRowCode(criterionCode);
      setPanelIssues([]);
      try {
        const res = await fetch(
          `/api/issues/by-criterion?wcagCode=${encodeURIComponent(criterionCode)}&projectId=${encodeURIComponent(vpat.project_id)}`
        );
        const json = await res.json();
        if (json.success)
          setPanelIssues(
            json.data.map(
              (issue: {
                id: string;
                assessment_id: string;
                title: string;
                severity: string;
                description: string | null;
                url: string | null;
              }) => ({
                id: issue.id,
                project_id: vpat.project_id,
                assessment_id: issue.assessment_id,
                title: issue.title,
                severity: issue.severity,
                description: issue.description ?? '',
                url: issue.url ?? '',
              })
            )
          );
      } catch {
        // panel shows empty state
      }
    },
    [vpat]
  );

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to publish');
        return;
      }
      setVpat(json.data);
      toast.success('VPAT published');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  }, [vpatId]);

  if (isLoading) return <div className="text-muted-foreground text-sm p-6">Loading…</div>;
  if (!vpat) return null;

  const isPublished = vpat.status === 'published';
  const resolved = rows.filter((r) => r.conformance !== 'not_evaluated').length;
  const total = rows.length;
  const canPublish = resolved === total && total > 0;
  const editionLabel = getEditionBadgeLabel(vpat);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'VPATs', href: '/vpats' }, { label: 'VPAT Detail' }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{vpat.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{editionLabel}</Badge>
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isPublished && (
            <Button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
              title={
                !canPublish
                  ? `${total - resolved} criteria still need a conformance decision`
                  : undefined
              }
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </Button>
          )}
          <DeleteVpatButton vpatId={vpat.id} vpatTitle={vpat.title} />
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium">
            {resolved} of {total} criteria resolved
          </p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: total > 0 ? `${(resolved / total) * 100}%` : '0%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Criteria Table */}
      <VpatCriteriaTable
        rows={rows}
        onRowChange={handleRowChange}
        onGenerateRow={handleGenerateRow}
        onGenerateAll={handleGenerateAll}
        generatingRowId={generatingRowId}
        readOnly={isPublished}
        aiEnabled={true}
        onCriterionClick={handleCriterionClick}
      />

      {/* Issues panel */}
      {panelRowCode && (
        <VpatIssuesPanel
          issues={panelIssues}
          criterionCode={panelRowCode}
          onClose={() => {
            setPanelRowCode(null);
            setPanelIssues([]);
          }}
        />
      )}
    </div>
  );
}
