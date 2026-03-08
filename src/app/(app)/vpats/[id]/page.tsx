export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Pencil } from 'lucide-react';
import { getVpat } from '@/lib/db/vpats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import { DeleteVpatButton } from '@/components/vpats/delete-vpat-button';
import { PublishVpatButton } from '@/components/vpats/publish-vpat-button';
import { WCAG_CRITERIA, buildDefaultCriteriaRows } from '@/lib/vpats/wcag-criteria';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

type PageProps = { params: Promise<{ id: string }> };

export default async function VpatDetailPage({ params }: PageProps) {
  const { id } = await params;
  const vpat = getVpat(id);

  if (!vpat) {
    notFound();
  }

  const isPublished = vpat.status === 'published';

  // Build criteria display rows: use stored criteria_rows if present, else default all to not_evaluated
  const criteriaRows =
    vpat.criteria_rows.length > 0
      ? vpat.criteria_rows.map((r) => ({
          criterion_code: r.criterion_code,
          conformance: r.conformance,
          remarks: r.remarks ?? '',
          related_issue_ids: r.related_issue_ids,
        }))
      : buildDefaultCriteriaRows();

  const scopeLabel =
    vpat.wcag_scope.length > 0
      ? `${vpat.wcag_scope.length} of ${WCAG_CRITERIA.length} criteria`
      : `All ${WCAG_CRITERIA.length} criteria`;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'VPATs', href: '/vpats' }, { label: vpat.title }]} />
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{vpat.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/vpats/${vpat.id}/export?format=html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Export HTML
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/vpats/${vpat.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <PublishVpatButton vpatId={vpat.id} isPublished={isPublished} />
          <DeleteVpatButton vpatId={vpat.id} vpatTitle={vpat.title} />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <VpatCriteriaTable criteria={criteriaRows} readOnly />
        </div>

        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                VPAT Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusBadgeClass(vpat.status)} variant="outline">
                  {vpat.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>v{vpat.version_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Scope</span>
                <span className="text-right">{scopeLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(vpat.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(vpat.updated_at).toLocaleDateString()}</span>
              </div>
              {vpat.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span>{new Date(vpat.published_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
