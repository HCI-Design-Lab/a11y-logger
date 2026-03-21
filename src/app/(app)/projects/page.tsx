import { getProjects } from '@/lib/db/projects';
import { ProjectsListView } from '@/components/projects/projects-list-view';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsListView projects={projects} />;
}
