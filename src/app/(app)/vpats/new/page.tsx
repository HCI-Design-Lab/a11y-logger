'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VpatCriteriaTable, type CriterionRow } from '@/components/vpats/vpat-criteria-table';
import { buildDefaultCriteriaRows, CONFORMANCE_DB_VALUE } from '@/lib/vpats/wcag-criteria';

function buildInitialCriteria(): CriterionRow[] {
  return buildDefaultCriteriaRows().map((r) => ({
    criterion_code: r.criterion_code,
    conformance: r.conformance,
    remarks: '',
    related_issue_ids: [],
  }));
}

export default function NewVpatPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [criteria, setCriteria] = useState<CriterionRow[]>(buildInitialCriteria);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!projectId.trim()) {
      toast.error('Project ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const criteriaRows = criteria.map((r) => ({
        criterion_code: r.criterion_code,
        // Normalise: if value is already a db key keep it, else map from display label
        conformance: (CONFORMANCE_DB_VALUE[r.conformance] ?? r.conformance) as
          | 'supports'
          | 'partially_supports'
          | 'does_not_support'
          | 'not_applicable'
          | 'not_evaluated',
        remarks: r.remarks ?? null,
        related_issue_ids: r.related_issue_ids,
      }));

      const res = await fetch('/api/vpats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          project_id: projectId.trim(),
          wcag_scope: [],
          criteria_rows: criteriaRows,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to create VPAT');
        return;
      }
      toast.success('VPAT created');
      router.push(`/vpats/${json.data.id}`);
    } catch {
      toast.error('Failed to create VPAT');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/vpats"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to VPATs
      </Link>

      <h1 className="text-2xl font-bold mb-6">New VPAT</h1>

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme SaaS Platform VPAT 2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Paste a project ID"
                required
              />
              <p className="text-xs text-muted-foreground">
                Find the project ID on the Projects page.
              </p>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Criteria</h2>
          <VpatCriteriaTable criteria={criteria} onChange={setCriteria} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/vpats">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create VPAT'}
          </Button>
        </div>
      </form>
    </div>
  );
}
