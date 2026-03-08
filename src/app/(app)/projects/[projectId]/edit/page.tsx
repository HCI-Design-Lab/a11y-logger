'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectForm } from '@/components/projects/project-form';
import type { Project } from '@/lib/db/projects';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProject(json.data);
        } else {
          toast.error('Project not found');
          router.push('/projects');
        }
      })
      .catch(() => {
        toast.error('Failed to load project');
        router.push('/projects');
      })
      .finally(() => setFetching(false));
  }, [projectId, router]);

  const handleSubmit = async (data: { name: string; description: string; product_url: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Project updated');
      router.push(`/projects/${projectId}`);
    } catch {
      toast.error('Failed to update project');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <p role="status" className="text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (!project) {
    router.push('/projects');
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <ProjectForm project={project} onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
