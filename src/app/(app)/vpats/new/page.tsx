'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsYaml from 'js-yaml';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { parseOpenAcr, type OpenAcrParseResult } from '@/lib/import/parse-openacr';

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
  {
    value: 'IMPORT',
    label: 'Import from OpenACR',
    description: 'Import an existing OpenACR YAML file',
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

type Edition = 'WCAG' | '508' | 'EU' | 'INT' | 'IMPORT';

export default function NewVpatPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [edition, setEdition] = useState<Edition>('WCAG');

  // Step 2 — create flow
  const [wcagVersion, setWcagVersion] = useState<'2.1' | '2.2'>('2.1');
  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [productScope, setProductScope] = useState<string[]>(['web']);

  // Step 2 — import flow
  const [yamlString, setYamlString] = useState('');
  const [parsed, setParsed] = useState<OpenAcrParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 — shared
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectsError, setProjectsError] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setProjects(body.data);
      })
      .catch(() => {
        setProjectsError(true);
      });
  }, []);

  function toggleScope(value: string) {
    setProductScope((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const doc = jsYaml.load(text);
        const result = parseOpenAcr(doc);
        if (!result) {
          setParseError(
            'File does not appear to be a valid OpenACR YAML (missing catalog or chapters).'
          );
          return;
        }
        setYamlString(text);
        setParsed(result);
      } catch {
        setParseError('Could not parse YAML. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!projectId) { toast.error('Project is required'); return; }
    if (productScope.length === 0) { toast.error('Select at least one product scope'); return; }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        project_id: projectId,
        standard_edition: edition,
        product_scope: productScope,
        description: description.trim() || null,
      };
      if (edition !== '508') payload.wcag_version = wcagVersion;
      if (edition !== '508' && edition !== 'EU') payload.wcag_level = wcagLevel;

      const res = await fetch('/api/vpats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to create VPAT'); return; }
      toast.success('VPAT created');
      router.push(`/vpats/${json.data.id}`);
    } catch {
      toast.error('Failed to create VPAT');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportSubmit() {
    if (isSubmitting) return;
    if (!projectId) { toast.error('Project is required'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vpats/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, yaml: yamlString }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Import failed'); return; }
      toast.success('VPAT imported');
      router.push(`/vpats/${json.data.id}`);
    } catch {
      toast.error('Import failed');
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
                  onChange={() => setEdition(ed.value as Edition)}
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
                Next <ChevronRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload (import flow) */}
      {step === 2 && edition === 'IMPORT' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 of 3: Upload OpenACR</CardTitle>
            <CardDescription>Upload a valid OpenACR YAML file to import.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="yaml-file-input">YAML File</Label>
              <input
                id="yaml-file-input"
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileChange}
                className="block w-full text-sm mt-1"
              />
            </div>
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            {parsed && (
              <div className="rounded border p-3 text-sm space-y-1">
                <p className="font-medium">{parsed.title}</p>
                <p className="text-muted-foreground">
                  {parsed.standard_edition} · WCAG {parsed.wcag_version} · Level {parsed.wcag_level}
                </p>
                <p className="text-muted-foreground">{parsed.criteria.length} criteria</p>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button type="button" variant="cancel" onClick={() => setStep(1)}>
                <ChevronLeft /> Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!parsed}>
                Next <ChevronRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Scope (create flow) */}
      {step === 2 && edition !== 'IMPORT' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 of 3: Scope</CardTitle>
            <CardDescription>Configure the scope for this VPAT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {edition !== '508' && (
              <div className="space-y-1.5">
                <Label htmlFor="wcag-version">WCAG Version</Label>
                <Select value={wcagVersion} onValueChange={(v) => setWcagVersion(v as '2.1' | '2.2')}>
                  <SelectTrigger id="wcag-version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.1">WCAG 2.1</SelectItem>
                    <SelectItem value="2.2">WCAG 2.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {edition !== '508' && edition !== 'EU' && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Conformance Level</legend>
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
                      {lvl === 'A' ? 'Level A only' : lvl === 'AA' ? 'Level A + AA' : 'Level A + AA + AAA'}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {(edition === '508' || edition === 'EU') && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                Conformance level is locked to A + AA for{' '}
                {edition === '508' ? 'Section 508' : 'EN 301 549'}.
              </p>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Product Scope</legend>
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
            </fieldset>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="cancel" onClick={() => setStep(1)}>
                <ChevronLeft /> Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={productScope.length === 0}>
                Next <ChevronRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Project + Confirm (import flow) */}
      {step === 3 && edition === 'IMPORT' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3 of 3: Select Project</CardTitle>
            <CardDescription>Associate this import with a project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsed && (
              <div className="rounded border p-3 text-sm space-y-1 bg-muted/30">
                <p className="font-medium">{parsed.title}</p>
                <p className="text-muted-foreground">
                  {parsed.standard_edition} · WCAG {parsed.wcag_version} · Level {parsed.wcag_level} ·{' '}
                  {parsed.criteria.length} criteria
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="import-project">Project *</Label>
              <select
                id="import-project"
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
              {projectsError && (
                <p className="text-sm text-destructive">Failed to load projects. Please refresh.</p>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="cancel" onClick={() => setStep(2)}>
                <ChevronLeft /> Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="cancel" asChild>
                  <Link href="/vpats">Cancel</Link>
                </Button>
                <Button onClick={handleImportSubmit} disabled={!projectId || isSubmitting}>
                  {isSubmitting ? 'Importing…' : 'Import'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Details (create flow) */}
      {step === 3 && edition !== 'IMPORT' && (
        <form onSubmit={handleCreateSubmit}>
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
                <Label htmlFor="project">Project *</Label>
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
                {projectsError && (
                  <p className="text-sm text-destructive">
                    Failed to load projects. Please refresh the page.
                  </p>
                )}
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
                  <Button type="button" variant="cancel" asChild>
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
