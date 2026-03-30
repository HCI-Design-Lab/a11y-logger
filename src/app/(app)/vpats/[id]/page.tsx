'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { VpatSettingsMenu } from '@/components/vpats/vpat-settings-menu';
import type { VpatData } from '@/lib/db/vpats';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'criteria' | 'history'>('criteria');
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
      setVpat(json.data);
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

  if (isLoading) return <div className="text-muted-foreground text-sm p-6">Loading…</div>;
  if (!vpat) return null;

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
              isPublished={isPublished}
              canPublish={isReviewed}
              isPublishing={isPublishing}
              onPublish={handlePublish}
              variant="view"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap-1 mb-4">
          <Button
            size="sm"
            variant={activeTab === 'criteria' ? 'default' : 'outline'}
            onClick={() => setActiveTab('criteria')}
            aria-pressed={activeTab === 'criteria'}
          >
            Criteria
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            aria-pressed={activeTab === 'history'}
          >
            <History className="mr-1 h-4 w-4" />
            Version History
            {snapshots.length > 0 && (
              <span className="ml-1 text-xs opacity-70">({snapshots.length})</span>
            )}
          </Button>
        </div>

        {activeTab === 'criteria' && (
          <div className="space-y-6">
            <VpatCriteriaTable
              rows={vpat.criterion_rows}
              onRowChange={() => {}}
              onSaveRemarks={() => {}}
              onGenerateRow={() => {}}
              onGenerateAll={() => {}}
              generatingRowId={null}
              readOnly={true}
              aiEnabled={false}
              onCriterionClick={() => {}}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
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
          </div>
        )}
      </div>
    </div>
  );
}
