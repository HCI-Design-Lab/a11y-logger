'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/project-form';
import type { Project } from '@/lib/db/projects';

export default function EditProjectPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.projectId}`)
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
  }, [params.projectId, router]);

  const handleSubmit = async (data: { name: string; description: string; product_url: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Project updated');
      router.push(`/projects/${params.projectId}`);
    } catch {
      toast.error('Failed to update project');
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${params.projectId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Project
      </Link>
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm project={project} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
