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
    <main className="p-6 space-y-6">
      <section aria-labelledby="projects-heading">
        <div className="flex items-center justify-between">
          <h1 id="projects-heading" className="text-lg font-semibold">
            Projects
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="success">
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </section>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button asChild variant="outline" className="mt-4">
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
    </main>
  );
}
