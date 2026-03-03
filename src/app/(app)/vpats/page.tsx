export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getVpats } from '@/lib/db/vpats';
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

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

export default function VpatsPage() {
  const vpats = getVpats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VPATs</h1>
        <Button asChild>
          <Link href="/vpats/new">New VPAT</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {vpats.length === 0 ? (
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
          ) : (
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
                      {vpat.wcag_scope.length > 0
                        ? `${vpat.wcag_scope.length} criteria`
                        : 'All criteria'}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
