'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectForm } from '@/components/projects/project-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { CreateProjectInput } from '@/lib/validators/projects';

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
      <Card className="max-w-2xl">
        <CardContent>
          <ProjectForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
