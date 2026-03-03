import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectWithCounts } from '@/lib/db/projects';

interface ProjectCardProps {
  project: ProjectWithCounts;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} aria-label={project.name}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex gap-4 text-sm text-muted-foreground">
          <span>
            {project.assessment_count} assessment{project.assessment_count !== 1 ? 's' : ''}
          </span>
          <span>
            {project.issue_count} issue{project.issue_count !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
