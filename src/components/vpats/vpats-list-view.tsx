'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViewToggle } from '@/components/ui/view-toggle';
import { VpatCard } from '@/components/vpats/vpat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { VpatWithProgress } from '@/lib/db/vpats';

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

interface VpatsListViewProps {
  vpats: VpatWithProgress[];
}

export function VpatsListView({ vpats }: VpatsListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VPATs</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <Button asChild>
            <Link href="/vpats/new">New VPAT</Link>
          </Button>
        </div>
      </div>

      {vpats.length === 0 ? (
        <Card>
          <CardContent>
            <div className="border border-dashed rounded-lg p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">No VPATs yet</h2>
              <p className="text-muted-foreground mb-4">
                Create a Voluntary Product Accessibility Template to document how your product
                conforms to WCAG criteria.
              </p>
              <Button asChild>
                <Link href="/vpats/new">Create VPAT</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {vpats.map((v) => (
            <VpatCard key={v.id} vpat={v} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Version</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vpats.map((vpat) => (
                  <TableRow key={vpat.id}>
                    <TableCell>
                      <Link href={`/vpats/${vpat.id}`} className="font-medium hover:underline">
                        {vpat.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {vpat.resolved} of {vpat.total} criteria resolved
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(vpat.status)} variant="outline">
                        {vpat.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      v{vpat.version_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(vpat.updated_at).toLocaleDateString()}
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
