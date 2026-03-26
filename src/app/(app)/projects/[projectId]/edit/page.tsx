'use client';
import Link from 'next/link';
import { Save, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/project-form';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { Project } from '@/lib/db/projects';
import type { CreateProjectInput } from '@/lib/validators/projects';

const FORM_ID = 'edit-project-form';

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

  const handleSubmit = async (data: CreateProjectInput) => {
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
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${projectId}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <Card>
        <CardContent>
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            loading={loading}
            externalButtons={FORM_ID}
          />
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        <Button type="submit" form={FORM_ID} disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? 'Saving…' : 'Save Project'}
        </Button>
        <Button asChild variant="cancel">
          <Link href={`/projects/${projectId}`}>
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </Button>
        <div className="ml-auto">
          <DeleteProjectButton projectId={projectId} projectName={project.name} />
        </div>
      </div>
    </div>
  );
}
