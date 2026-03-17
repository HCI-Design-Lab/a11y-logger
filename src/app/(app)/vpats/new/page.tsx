'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const EDITIONS = [
  {
    value: 'WCAG',
    label: 'WCAG',
    description: 'Private sector / general web accessibility disclosure',
  },
  { value: '508', label: 'Section 508', description: 'U.S. federal government procurement' },
  { value: 'EU', label: 'EN 301 549', description: 'European public sector / EAA compliance' },
  {
    value: 'INT',
    label: 'International',
    description: 'Most comprehensive; includes all three standards',
  },
] as const;

const PRODUCT_SCOPES = [
  { value: 'web', label: 'Web' },
  { value: 'software-desktop', label: 'Desktop Software' },
  { value: 'software-mobile', label: 'Mobile Software' },
  { value: 'documents', label: 'Documents' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'telephony', label: 'Telephony' },
];

type Edition = 'WCAG' | '508' | 'EU' | 'INT';

export default function NewVpatPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [edition, setEdition] = useState<Edition>('WCAG');

  // Step 2
  const [wcagVersion, setWcagVersion] = useState<'2.1' | '2.2'>('2.1');
  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [productScope, setProductScope] = useState<string[]>(['web']);

  // Step 3
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setProjects(body.data);
      })
      .catch(() => {});
  }, []);

  function toggleScope(value: string) {
    setProductScope((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!projectId) {
      toast.error('Project is required');
      return;
    }
    if (productScope.length === 0) {
      toast.error('Select at least one product scope');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        project_id: projectId,
        standard_edition: edition,
        product_scope: productScope,
        description: description.trim() || null,
      };
      // Only include wcag_version and wcag_level for non-locked editions
      if (edition !== '508') {
        payload.wcag_version = wcagVersion;
      }
      if (edition !== '508' && edition !== 'EU') {
        payload.wcag_level = wcagLevel;
      }

      const res = await fetch('/api/vpats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: 'VPATs', href: '/vpats' }, { label: 'New VPAT' }]} />
      <h1 className="text-2xl font-bold">New VPAT</h1>

      {/* Step 1: Edition */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 of 3: Select Edition</CardTitle>
            <CardDescription>Choose the standard your VPAT will cover.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {EDITIONS.map((ed) => (
              <label
                key={ed.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  edition === ed.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="edition"
                  value={ed.value}
                  checked={edition === ed.value}
                  onChange={() => setEdition(ed.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{ed.label}</div>
                  <div className="text-sm text-muted-foreground">{ed.description}</div>
                </div>
              </label>
            ))}
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Scope */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 of 3: Scope</CardTitle>
            <CardDescription>Configure the scope for this VPAT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* WCAG Version — hidden for 508 */}
            {edition !== '508' && (
              <div className="space-y-2">
                <Label htmlFor="wcag-version">WCAG Version</Label>
                <select
                  id="wcag-version"
                  value={wcagVersion}
                  onChange={(e) => setWcagVersion(e.target.value as '2.1' | '2.2')}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="2.1">WCAG 2.1</option>
                  <option value="2.2">WCAG 2.2</option>
                </select>
              </div>
            )}

            {/* Conformance Level — hidden for 508 and EU */}
            {edition !== '508' && edition !== 'EU' && (
              <div className="space-y-2">
                <Label>Conformance Level</Label>
                <div className="space-y-2">
                  {(['A', 'AA', 'AAA'] as const).map((lvl) => (
                    <label key={lvl} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wcag-level"
                        value={lvl}
                        checked={wcagLevel === lvl}
                        onChange={() => setWcagLevel(lvl)}
                      />
                      <span className="text-sm">
                        {lvl === 'A'
                          ? 'Level A only'
                          : lvl === 'AA'
                            ? 'Level A + AA'
                            : 'Level A + AA + AAA'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(edition === '508' || edition === 'EU') && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                Conformance level is locked to A + AA for{' '}
                {edition === '508' ? 'Section 508' : 'EN 301 549'}.
              </p>
            )}

            {/* Product Scope */}
            <div className="space-y-2">
              <Label>Product Scope</Label>
              <p className="text-sm text-muted-foreground">
                Select all product types this VPAT covers.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCT_SCOPES.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productScope.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={productScope.length === 0}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Step 3 of 3: Details</CardTitle>
              <CardDescription>Name your VPAT and associate it with a project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme SaaS Platform VPAT 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Select a project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief notes about this assessment…"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/vpats">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create VPAT'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
