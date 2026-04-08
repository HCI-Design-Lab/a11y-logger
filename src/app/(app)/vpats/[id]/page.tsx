'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { History, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { VpatSettingsMenu } from '@/components/vpats/vpat-settings-menu';
import { VpatVersionHistoryTable } from '@/components/vpats/vpat-version-history-table';
import type { VpatData } from '@/lib/db/vpats';
import { EDITION_SECTION_KEYS, SECTION_TAB_LABELS } from '@/lib/vpat-tabs';

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
  const [locale, setLocale] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [snapshots, setSnapshots] = useState<
    {
      id: string;
      vpat_id: string;
      version_number: number;
      published_at: string;
      created_at: string;
    }[]
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
        setLocale((json.data.locale as string) ?? 'en');
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

  async function handlePublish() {
    if (!vpat) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/vpats/${vpat.id}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to publish');
        return;
      }
      setVpat((prev) => (prev ? { ...prev, ...json.data } : json.data));
      // Refresh snapshots
      const snapRes = await fetch(`/api/vpats/${vpat.id}/versions`);
      const snapJson = await snapRes.json();
      if (snapJson.success) setSnapshots(snapJson.data);
      toast.success('VPAT published');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleReview(reviewerName: string) {
    setIsReviewing(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: reviewerName }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to mark as reviewed');
        return;
      }
      setVpat((prev) => (prev ? { ...prev, ...json.data } : json.data));
      toast.success('VPAT marked as reviewed');
    } catch {
      toast.error('Failed to mark as reviewed');
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleUnpublish() {
    try {
      const res = await fetch(`/api/vpats/${vpatId}/unpublish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to unpublish');
        return;
      }
      setVpat((prev) => (prev ? { ...prev, ...json.data } : json.data));
      toast.success('VPAT unpublished');
    } catch {
      toast.error('Failed to unpublish');
    }
  }

  async function handleEditPublished() {
    try {
      const res = await fetch(`/api/vpats/${vpatId}/unpublish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to reset VPAT');
        return;
      }
      router.push(`/vpats/${vpatId}/edit`);
    } catch {
      toast.error('Failed to reset VPAT');
    }
  }

  if (isLoading) return <div className="text-muted-foreground text-sm p-6">Loading…</div>;
  if (!vpat) return null;

  const resolvedCount = vpat.criterion_rows.filter((r) => r.conformance !== 'not_evaluated').length;
  const totalCount = vpat.criterion_rows.length;

  const isPublished = vpat.status === 'published';
  const isReviewed = vpat.status === 'reviewed';
  const editionLabel = getEditionBadgeLabel(vpat);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'VPATs', href: '/vpats' }, { label: vpat.title }]} />

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
                    : isReviewed
                      ? 'bg-blue-100 border border-blue-500 text-primary dark:text-primary-foreground'
                      : 'bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground'
                }
              >
                {isPublished ? 'Published' : isReviewed ? 'Reviewed' : 'Draft'}
              </Badge>
            </div>
            {(isReviewed || isPublished) && vpat.reviewed_by && vpat.reviewed_at && (
              <p className="text-sm text-muted-foreground">
                Reviewed by {vpat.reviewed_by} on{' '}
                {new Date(vpat.reviewed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <VpatSettingsMenu
              vpatId={vpat.id}
              vpatTitle={vpat.title}
              status={vpat.status as 'draft' | 'reviewed' | 'published'}
              resolvedCount={resolvedCount}
              totalCount={totalCount}
              isPublishing={isPublishing}
              isReviewing={isReviewing}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onReview={handleReview}
              onEdit={handleEditPublished}
              variant="view"
            />
          </div>
        </div>
      </div>

      {(() => {
        const sectionKeys = EDITION_SECTION_KEYS[vpat.standard_edition] ?? ['A', 'AA', 'AAA'];
        return (
          <Tabs defaultValue="cover-sheet">
            <TabsList variant="line" className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="cover-sheet">
                <FileText className="h-4 w-4" />
                Cover Sheet
              </TabsTrigger>
              {sectionKeys.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {SECTION_TAB_LABELS[key] ?? key}
                </TabsTrigger>
              ))}
              <TabsTrigger value="history">
                <History className="h-4 w-4" />
                Version History
                {snapshots.length > 0 && (
                  <span className="ml-1 text-xs opacity-70">({snapshots.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cover-sheet">
              <p className="text-sm text-muted-foreground py-4">Cover Sheet coming soon.</p>
            </TabsContent>
            {sectionKeys.map((key) => (
              <TabsContent key={key} value={key}>
                <VpatCriteriaTable
                  rows={vpat.criterion_rows}
                  locale={locale}
                  sectionKey={key}
                  onRowChange={() => {}}
                  onSaveRemarks={() => {}}
                  readOnly={true}
                  aiEnabled={false}
                  onCriterionClick={() => {}}
                />
              </TabsContent>
            ))}
            <TabsContent value="history">
              <VpatVersionHistoryTable vpatId={vpatId} snapshots={snapshots} />
            </TabsContent>
          </Tabs>
        );
      })()}
    </div>
  );
}
