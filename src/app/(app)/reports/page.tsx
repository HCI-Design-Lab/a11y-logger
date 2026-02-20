export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getReports } from '@/lib/db/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'executive':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'detailed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

export default function ReportsPage() {
  const reports = getReports();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button asChild>
          <Link href="/reports/new">New Report</Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold mb-2">No reports yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first accessibility report to document findings and share with stakeholders.
          </p>
          <Button asChild>
            <Link href="/reports/new">Create Report</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Link href={`/reports/${report.id}`} className="font-medium hover:underline">
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeClass(report.type)} variant="outline">
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(report.status)} variant="outline">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(report.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
