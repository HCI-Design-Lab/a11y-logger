import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VpatWithProgress } from '@/lib/db/vpats';

function getEditionLabel(vpat: VpatWithProgress): string {
  if (vpat.standard_edition === '508') return 'Section 508';
  if (vpat.standard_edition === 'EU') return 'EN 301 549';
  if (vpat.standard_edition === 'INT') return 'International';
  return `WCAG ${vpat.wcag_version} · ${vpat.wcag_level}`;
}

interface VpatCardProps {
  vpat: VpatWithProgress;
}

export function VpatCard({ vpat }: VpatCardProps) {
  const editionLabel = getEditionLabel(vpat);
  const isPublished = vpat.status === 'published';

  return (
    <Link href={`/vpats/${vpat.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{vpat.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{vpat.project_name ?? 'No project'}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{editionLabel}</Badge>
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          <span className="text-muted-foreground">
            {vpat.resolved} of {vpat.total} criteria resolved
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
