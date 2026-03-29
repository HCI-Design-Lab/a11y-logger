'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { VpatIssuesPanel, type PanelIssue } from '@/components/vpats/vpat-issues-panel';
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

  const [generatingRowId, setGeneratingRowId] = useState<string | null>(null);
  const [panelRowCode, setPanelRowCode] = useState<string | null>(null);
  const [panelIssues, setPanelIssues] = useState<PanelIssue[]>([]);
  // Incremented after generate-all so VpatCriteriaTable remounts with fresh RHF defaults.
  const [tableKey, setTableKey] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateTotal, setGenerateTotal] = useState(0);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [hasShownEditWarning, setHasShownEditWarning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const pendingChanges = useRef<Map<string, { conformance?: string; remarks?: string }>>(new Map());

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
        // Show edit-warning immediately if VPAT is already reviewed
        if (json.data.status === 'reviewed') {
          setShowEditWarning(true);
          setHasShownEditWarning(true);
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

  // Updates local state + queues change for save.
  const handleRowChange = useCallback(
    (rowId: string, update: { conformance?: string }) => {
      if (vpat?.status === 'reviewed' && !hasShownEditWarning) {
        setShowEditWarning(true);
      }
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? ({ ...r, ...update } as VpatCriterionRow) : r))
      );
      const existing = pendingChanges.current.get(rowId) ?? {};
      pendingChanges.current.set(rowId, { ...existing, ...update });
    },
    [vpat, hasShownEditWarning]
  );

  // Called by the table after 500ms debounce — queues remarks for save.
  const handleSaveRemarks = useCallback(
    (rowId: string, remarks: string) => {
      if (vpat?.status === 'reviewed' && !hasShownEditWarning) {
        setShowEditWarning(true);
      }
      const existing = pendingChanges.current.get(rowId) ?? {};
      pendingChanges.current.set(rowId, { ...existing, remarks });
    },
    [vpat, hasShownEditWarning]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const entries = Array.from(pendingChanges.current.entries());
      if (entries.length > 0) {
        const results = await Promise.all(
          entries.map(([rowId, changes]) =>
            fetch(`/api/vpats/${vpatId}/rows/${rowId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(changes),
            }).then((r) => r.json())
          )
        );
        if (results.some((r) => !r.success)) {
          toast.error('Some changes failed to save');
          return;
        }
      }
      router.push(`/vpats/${vpatId}`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [vpatId, router]);

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

  const handleReview = useCallback(async () => {
    if (!reviewerName.trim()) return;
    setIsReviewing(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: reviewerName.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to mark as reviewed');
        return;
      }
      setVpat(json.data);
      setShowReviewModal(false);
      setReviewerName('');
      toast.success('VPAT marked as reviewed');
    } catch {
      toast.error('Failed to mark as reviewed');
    } finally {
      setIsReviewing(false);
    }
  }, [vpatId, reviewerName]);

  if (isLoading) return <div className="text-muted-foreground text-sm p-6">Loading…</div>;
  if (!vpat) return null;

  const isReviewed = vpat.status === 'reviewed';
  const isPublished = vpat.status === 'published';
  const resolved = rows.filter((r) => r.conformance !== 'not_evaluated').length;
  const total = rows.length;
  const canReview = resolved === total && total > 0 && !isReviewed && !isPublished;

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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{vpat.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{editionLabel}</Badge>
            <Badge
              className={
                isPublished
                  ? 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground'
                  : isReviewed
                  ? 'bg-blue-100 border border-blue-500 text-primary dark:text-primary-foreground'
                  : 'bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground'
              }
            >
              {isPublished ? 'Published' : isReviewed ? 'Reviewed' : 'Draft'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving…' : 'Save VPAT'}
        </Button>
        <Button asChild variant="cancel">
          <Link href={`/vpats/${vpatId}`}>
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </Button>
        <Button
          className="ml-auto"
          onClick={() => setShowReviewModal(true)}
          disabled={!canReview}
          title={!canReview ? 'All criteria must be evaluated before review' : undefined}
        >
          Review
        </Button>
      </div>

      {/* Edit-warning modal */}
      <Dialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <DialogContent aria-label="This VPAT has been reviewed" className="max-w-md">
          <DialogHeader>
            <DialogTitle>This VPAT has been reviewed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This VPAT has been reviewed. If you change any conformance levels or remarks, the
            reviewed status will be removed and it will need to be reviewed again before publishing.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="cancel"
              onClick={() => {
                setShowEditWarning(false);
                router.push(`/vpats/${vpatId}`);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setHasShownEditWarning(true);
                setShowEditWarning(false);
              }}
            >
              Continue to Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent aria-label="Submit Review" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            By submitting your name, you confirm that you have personally reviewed this VPAT and
            that the results accurately reflect the product&apos;s accessibility conformance.
          </p>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Full name"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              aria-label="Reviewer full name"
            />
            <div className="flex justify-end gap-2">
              <Button variant="cancel" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={!reviewerName.trim() || isReviewing}
              >
                {isReviewing ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
