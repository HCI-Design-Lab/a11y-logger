'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViewToggle } from '@/components/ui/view-toggle';
import { ReportCard } from '@/components/reports/report-card';
import { getStatusBadgeClass } from '@/components/reports/report-badge-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Report } from '@/lib/db/reports';

interface ReportsListViewProps {
  reports: Report[];
}

export function ReportsListView({ reports }: ReportsListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button asChild>
          <Link href="/reports/new">New Report</Link>
        </Button>
      </div>
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
