'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
    ? 'bg-green-100 border border-green-500 text-primary dark:text-primary-foreground'
    : 'bg-yellow-100 border border-yellow-500 text-primary dark:text-primary-foreground';
}

interface VpatsListViewProps {
  vpats: VpatWithProgress[];
}

export function VpatsListView({ vpats }: VpatsListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="p-6 space-y-6">
      <section aria-labelledby="vpats-heading">
        <div className="flex items-center justify-between">
          <h1 id="vpats-heading" className="text-lg font-semibold">
            VPATs
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="success">
              <Link href="/vpats/new">
                <Plus className="mr-2 h-4 w-4" />
                New VPAT
              </Link>
            </Button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </section>

      {vpats.length === 0 ? (
        <Card>
          <CardContent>
            <div className="border border-dashed rounded-lg p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">No VPATs yet</h2>
              <p className="text-muted-foreground mb-4">
                Create a Voluntary Product Accessibility Template to document how your product
                conforms to WCAG criteria.
              </p>
              <Button asChild size="sm">
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
                      <Badge className={getStatusBadgeClass(vpat.status)}>
                        {vpat.status === 'published' ? 'Published' : 'Draft'}
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
