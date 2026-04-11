import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('vpats');
  const tStatus = useTranslations('vpats.status');
  const editionLabel = getEditionLabel(vpat);
  const isPublished = vpat.status === 'published';

  return (
    <Link href={`/vpats/${vpat.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{vpat.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {vpat.project_name ?? t('card.no_project')}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{editionLabel}</Badge>
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? tStatus('published') : tStatus('draft')}
          </Badge>
          <span className="text-muted-foreground">
            {t('card.criteria_resolved', { resolved: vpat.resolved, total: vpat.total })}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
