import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VpatWithProject } from '@/lib/db/vpats';
import { countIssues } from '@/lib/db/vpats';

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

interface VpatCardProps {
  vpat: VpatWithProject;
}

export function VpatCard({ vpat }: VpatCardProps) {
  const issueCount = countIssues(vpat.criteria_rows);
  return (
    <Card className="h-full hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link href={`/vpats/${vpat.id}`} className="hover:underline">
            {vpat.title}
          </Link>
        </CardTitle>
        {vpat.project_id && (
          <Link
            href={`/projects/${vpat.project_id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {vpat.project_name ?? 'Unknown'}
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-sm">
        <Badge className={getStatusBadgeClass(vpat.status)} variant="outline">
          {vpat.status}
        </Badge>
        <Badge variant="outline" className="text-xs">
          WCAG {vpat.wcag_version} · {vpat.wcag_level}
        </Badge>
        <span className="text-muted-foreground">v{vpat.version_number}</span>
        <span className="text-muted-foreground">
          {issueCount} issue{issueCount !== 1 ? 's' : ''}
        </span>
      </CardContent>
    </Card>
  );
}
