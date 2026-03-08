'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VpatCriteriaTable, type CriterionRow } from '@/components/vpats/vpat-criteria-table';
import { buildDefaultCriteriaRows, CONFORMANCE_DB_VALUE } from '@/lib/vpats/wcag-criteria';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface VpatData {
  id: string;
  title: string;
  status: string;
  wcag_scope: string[];
  criteria_rows: Array<{
    criterion_code: string;
    conformance: string;
    remarks: string | null;
    related_issue_ids: string[];
  }>;
}

export default function EditVpatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vpatId = params.id;

  const [title, setTitle] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<CriterionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadVpat() {
      try {
        const res = await fetch(`/api/vpats/${vpatId}`);
        const json = await res.json();
        if (!json.success) {
          toast.error('Failed to load VPAT');
          router.push('/vpats');
          return;
        }
        const vpat: VpatData = json.data;
        setTitle(vpat.title);

        const rows: CriterionRow[] =
          vpat.criteria_rows.length > 0
            ? vpat.criteria_rows.map((r) => ({
                criterion_code: r.criterion_code,
                conformance: r.conformance,
                remarks: r.remarks ?? '',
                related_issue_ids: r.related_issue_ids,
              }))
            : buildDefaultCriteriaRows().map((r) => ({
                criterion_code: r.criterion_code,
                conformance: r.conformance,
                remarks: '',
                related_issue_ids: [],
              }));
        setCriteria(rows);
      } catch {
        toast.error('Failed to load VPAT');
        router.push('/vpats');
      } finally {
        setIsLoading(false);
      }
    }
    loadVpat();
  }, [vpatId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const criteriaRows = criteria.map((r) => ({
        criterion_code: r.criterion_code,
        conformance: (CONFORMANCE_DB_VALUE[r.conformance] ?? r.conformance) as
          | 'supports'
          | 'partially_supports'
          | 'does_not_support'
          | 'not_applicable'
          | 'not_evaluated',
        remarks: r.remarks ?? null,
        related_issue_ids: r.related_issue_ids,
      }));

      const res = await fetch(`/api/vpats/${vpatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          criteria_rows: criteriaRows,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to update VPAT');
        return;
      }
      toast.success('VPAT saved');
      router.push(`/vpats/${vpatId}`);
      router.refresh();
    } catch {
      toast.error('Failed to update VPAT');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm p-6">Loading VPAT…</div>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'VPATs', href: '/vpats' },
          ...(title !== null ? [{ label: title, href: `/vpats/${vpatId}` }] : []),
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">Edit VPAT</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>VPAT Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title ?? ''}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme SaaS Platform VPAT 2024"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Criteria</h2>
          <VpatCriteriaTable criteria={criteria} onChange={setCriteria} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/vpats/${vpatId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
