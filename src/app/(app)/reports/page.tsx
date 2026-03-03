export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getReports } from '@/lib/db/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTypeBadgeClass, getStatusBadgeClass } from '@/components/reports/report-badge-utils';

export default function ReportsPage() {
  const reports = getReports();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button asChild>
          <Link href="/reports/new">New Report</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {reports.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">No reports yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your first accessibility report to document findings and share with
                stakeholders.
              </p>
              <Button asChild>
                <Link href="/reports/new">Create Report</Link>
              </Button>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
