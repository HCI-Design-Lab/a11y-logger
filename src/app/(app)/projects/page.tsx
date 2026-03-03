import { getProjects } from '@/lib/db/projects';
import { ProjectsListView } from '@/components/projects/projects-list-view';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  const projects = getProjects();
  return <ProjectsListView projects={projects} />;
}
