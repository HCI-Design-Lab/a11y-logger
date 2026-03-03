import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Vpat } from '@/lib/db/vpats';

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

interface VpatCardProps {
  vpat: Vpat;
}

export function VpatCard({ vpat }: VpatCardProps) {
  const scopeLabel = vpat.wcag_scope.length > 0
    ? `${vpat.wcag_scope.length} criteria`
    : 'All criteria';

  return (
    <Link href={`/vpats/${vpat.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{vpat.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Badge className={getStatusBadgeClass(vpat.status)} variant="outline">
            {vpat.status}
          </Badge>
          <span className="text-muted-foreground">v{vpat.version_number}</span>
          <span className="text-muted-foreground">{scopeLabel}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
