'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { VpatIssuesPanel, type PanelIssue } from '@/components/vpats/vpat-issues-panel';
import { VpatSettingsMenu } from '@/components/vpats/vpat-settings-menu';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';
import type { VpatData } from '@/lib/db/vpats';

function getEditionBadgeLabel(vpat: VpatData): string {
  if (vpat.standard_edition === '508') return 'Section 508';
  if (vpat.standard_edition === 'EU') return 'EN 301 549';
  if (vpat.standard_edition === 'INT') return 'International';
  return `WCAG ${vpat.wcag_version} · ${vpat.wcag_level}`;
}

export default function VpatEditPage() {
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
  // Incremented after generate-all so VpatCriteriaTable remounts with fresh RHF defaults.
  const [tableKey, setTableKey] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateTotal, setGenerateTotal] = useState(0);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [snapshots, setSnapshots] = useState<
    { id: string; version_number: number; published_at: string }[]
  >([]);

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
        // Load version history
        try {
          const snapRes = await fetch(`/api/vpats/${vpatId}/versions`);
          const snapJson = await snapRes.json();
          if (snapJson.success) setSnapshots(snapJson.data);
        } catch {
          // non-fatal — version history tab shows empty state
        }
      } catch {
        toast.error('Failed to load VPAT');
        router.push('/vpats');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [vpatId, router]);

  // Called immediately on conformance change — updates progress bar + saves.
  const handleRowChange = useCallback(
    async (rowId: string, update: { conformance?: string }) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? ({ ...r, ...update } as VpatCriterionRow) : r))
      );
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
    },
    [vpatId]
  );

  // Called by the table after 500ms debounce — remarks only, no state update needed.
  const handleSaveRemarks = useCallback(
    async (rowId: string, remarks: string) => {
      try {
        const res = await fetch(`/api/vpats/${vpatId}/rows/${rowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarks }),
        });
        const json = await res.json();
        if (!json.success) toast.error(json.error ?? 'Failed to save');
      } catch {
        toast.error('Failed to save');
      }
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
    const pending = rows.filter((r) => !r.remarks);
    if (pending.length === 0) {
      toast('All criteria already have remarks');
      return;
    }

    setGenerateTotal(pending.length);
    setGenerateProgress(0);
    setIsGeneratingAll(true);

    let generated = 0;
    for (const row of pending) {
      try {
        const res = await fetch(`/api/vpats/${vpatId}/rows/${row.id}/generate`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          setRows((prev) => prev.map((r) => (r.id === row.id ? json.data : r)));
          generated++;
        }
      } catch {
        // continue on error — best effort
      }
      setGenerateProgress((p) => p + 1);
    }

    setIsGeneratingAll(false);
    setTableKey((k) => k + 1);
    toast.success(`Generated ${generated} of ${pending.length} criteria`);
  }, [vpatId, rows]);

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
      // Refresh snapshots after publish
      try {
        const snapRes = await fetch(`/api/vpats/${vpatId}/versions`);
        const snapJson = await snapRes.json();
        if (snapJson.success) setSnapshots(snapJson.data);
      } catch {
        // non-fatal
      }
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
      <Breadcrumbs
        items={[
          { label: 'VPATs', href: '/vpats' },
          { label: vpat.title, href: `/vpats/${vpatId}` },
          { label: 'Edit VPAT' },
        ]}
      />

      {/* Header card */}
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 px-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{vpat.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{editionLabel}</Badge>
              <Badge
                className={
                  isPublished
                    ? 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground'
                    : 'bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground'
                }
              >
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="cancel">
              <Link href={`/vpats/${vpatId}`}>
                <X className="h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <VpatSettingsMenu
              vpatId={vpat.id}
              vpatTitle={vpat.title}
              isPublished={isPublished}
              canPublish={canPublish}
              isPublishing={isPublishing}
              onPublish={handlePublish}
              variant="edit"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="criteria">
        <TabsList>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" />
            Version History
            {snapshots.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({snapshots.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-6">
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

          {/* Criteria Table — key resets RHF defaults after generate-all */}
          <VpatCriteriaTable
            key={tableKey}
            rows={rows}
            onRowChange={handleRowChange}
            onSaveRemarks={handleSaveRemarks}
            onGenerateRow={handleGenerateRow}
            onGenerateAll={handleGenerateAll}
            generatingRowId={generatingRowId}
            readOnly={isPublished}
            aiEnabled={true}
            onCriterionClick={handleCriterionClick}
          />
        </TabsContent>

        <TabsContent value="history">
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No published versions yet. Publish this VPAT to create a snapshot.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Version</th>
                    <th className="px-4 py-2 text-left font-medium">Published</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="border-b last:border-0">
                      <td className="px-4 py-2">v{snap.version_number}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(snap.published_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <a
                          href={`/vpats/${vpatId}/versions/${snap.version_number}`}
                          className="text-sm font-medium underline-offset-4 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate All progress modal */}
      <Dialog open={isGeneratingAll}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Generating Criteria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {generateProgress} of {generateTotal} criteria generated
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: generateTotal > 0 ? `${(generateProgress / generateTotal) * 100}%` : '0%',
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
