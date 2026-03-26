'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/project-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { CreateProjectInput } from '@/lib/validators/projects';

const FORM_ID = 'new-project-form';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateProjectInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Project created');
      router.push(`/projects/${json.data.id}`);
    } catch {
      toast.error('Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'New Project' }]} />
      <h1 className="text-2xl font-bold">New Project</h1>
      <Card>
        <CardContent>
          <ProjectForm onSubmit={handleSubmit} loading={loading} externalButtons={FORM_ID} />
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        <Button type="submit" form={FORM_ID} disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? 'Saving…' : 'Save Project'}
        </Button>
        <Button asChild variant="cancel">
          <Link href="/projects">
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}
