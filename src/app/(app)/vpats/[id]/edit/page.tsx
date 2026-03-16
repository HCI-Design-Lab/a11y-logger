'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VpatCriteriaWithPanel } from '@/components/vpats/vpat-criteria-with-panel';
import { type CriterionRow } from '@/components/vpats/vpat-criteria-table';
import {
  buildDefaultCriteriaRows,
  CONFORMANCE_DB_VALUE,
  CONFORMANCE_OPTIONS,
} from '@/lib/vpats/wcag-criteria';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface VpatData {
  id: string;
  title: string;
  status: string;
  wcag_version: string;
  wcag_level: string;
  wcag_scope: string[];
  criteria_rows: Array<{
    criterion_code: string;
    conformance: string;
    remarks: string | null;
    related_issue_ids: string[];
  }>;
  project_id: string;
}

export default function EditVpatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vpatId = params.id;

  const [title, setTitle] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<CriterionRow[]>([]);
  const [wcagVersion, setWcagVersion] = useState<string>('');
  const [wcagLevel, setWcagLevel] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

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
        setWcagVersion(vpat.wcag_version ?? '');
        setWcagLevel(vpat.wcag_level ?? '');
        setProjectId(vpat.project_id ?? '');

        const rows: CriterionRow[] =
          vpat.criteria_rows.length > 0
            ? vpat.criteria_rows.map((r) => ({
                criterion_code: r.criterion_code,
                conformance: r.conformance,
                remarks: r.remarks ?? '',
                related_issue_ids: r.related_issue_ids,
              }))
            : buildDefaultCriteriaRows(
                (vpat.wcag_version as '2.1' | '2.2') ?? '2.1',
                (vpat.wcag_level as 'A' | 'AA' | 'AAA') ?? 'AA'
              ).map((r) => ({
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

  async function handleGenerateAll() {
    if (!projectId || isGeneratingAll) return;
    setIsGeneratingAll(true);
    try {
      const updated = [...criteria];
      for (let i = 0; i < updated.length; i++) {
        const row = updated[i];
        const res = await fetch('/api/ai/generate-vpat-narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, criterionCode: row.criterion_code }),
        });
        const json = await res.json();
        if (json.success && json.data?.narrative) {
          updated[i] = { ...row, remarks: json.data.narrative };
        }
      }
      setCriteria(updated);
      toast.success('Remarks generated for all criteria');
    } catch {
      toast.error('Failed to generate remarks');
    } finally {
      setIsGeneratingAll(false);
    }
  }

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
        conformance: (CONFORMANCE_DB_VALUE[r.conformance as (typeof CONFORMANCE_OPTIONS)[number]] ??
          r.conformance) as
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
            {wcagVersion && wcagLevel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  WCAG {wcagVersion} · Level {wcagLevel}
                </Badge>
                <span className="text-xs">Scope is locked and cannot be changed.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Criteria</h2>
          {projectId && (
            <div className="flex justify-end mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateAll}
                disabled={isGeneratingAll}
              >
                {isGeneratingAll ? 'Generating…' : 'Generate All'}
              </Button>
            </div>
          )}
          <VpatCriteriaWithPanel criteria={criteria} onChange={setCriteria} projectId={projectId} />
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
