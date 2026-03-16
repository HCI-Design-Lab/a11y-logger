'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

type Step = 'scope' | 'details';

interface Project {
  id: string;
  name: string;
}

export default function NewVpatPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('scope');
  const [wcagVersion, setWcagVersion] = useState<'2.1' | '2.2'>('2.1');
  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 'details') {
      fetch('/api/projects')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setProjects(json.data);
        })
        .catch(() => {});
    }
  }, [step]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vpats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          project_id: projectId,
          wcag_version: wcagVersion,
          wcag_level: wcagLevel,
          wcag_scope: [],
          criteria_rows: [],
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
      <Breadcrumbs items={[{ label: 'VPATs', href: '/vpats' }, { label: 'New VPAT' }]} />
      <h1 className="text-2xl font-bold mb-6">New VPAT</h1>

      {step === 'scope' ? (
        <div className="space-y-6 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>WCAG Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">WCAG Version</Label>
                <RadioGroup
                  value={wcagVersion}
                  onValueChange={(v) => setWcagVersion(v as '2.1' | '2.2')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2.1" id="v21" />
                    <Label htmlFor="v21">WCAG 2.1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2.2" id="v22" />
                    <Label htmlFor="v22">WCAG 2.2</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Conformance Level</Label>
                <RadioGroup
                  value={wcagLevel}
                  onValueChange={(v) => setWcagLevel(v as 'A' | 'AA' | 'AAA')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="A" id="lvlA" />
                    <Label htmlFor="lvlA">Level A only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AA" id="lvlAA" />
                    <Label htmlFor="lvlAA">Level A + AA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AAA" id="lvlAAA" />
                    <Label htmlFor="lvlAAA">Level A + AA + AAA</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/vpats">Cancel</Link>
            </Button>
            <Button type="button" onClick={() => setStep('details')}>
              Next
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
                  placeholder="e.g. Acme SaaS Platform VPAT 2025"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Scope: WCAG {wcagVersion} · Level {wcagLevel} (locked after creation)
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setStep('scope')}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create VPAT'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
