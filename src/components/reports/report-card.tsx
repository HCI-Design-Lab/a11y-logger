import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/lib/db/reports';

function getTypeBadgeClass(type: Report['type']): string {
  switch (type) {
    case 'executive':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'detailed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'custom':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusBadgeClass(status: Report['status']): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const updatedDate = new Date(report.updated_at).toLocaleDateString();

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
