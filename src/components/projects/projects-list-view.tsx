'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectsTable } from '@/components/projects/projects-table';
import type { ProjectWithCounts } from '@/lib/db/projects';

interface ProjectsListViewProps {
  projects: ProjectWithCounts[];
}

export function ProjectsListView({ projects }: ProjectsListViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
      <div className="flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Create your first project</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <ProjectsTable projects={projects} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
