import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/lib/db/reports';
import { getTypeBadgeClass, getStatusBadgeClass } from './report-badge-utils';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const dateObj = new Date(report.updated_at);
  const updatedDate = isNaN(dateObj.getTime())
    ? 'Unknown'
    : dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{report.title}</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Badge className={getTypeBadgeClass(report.type)} variant="outline">
                {report.type}
              </Badge>
              <Badge className={getStatusBadgeClass(report.status)} variant="outline">
                {report.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Updated {updatedDate}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
