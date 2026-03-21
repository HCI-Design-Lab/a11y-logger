import { getProjects } from '@/lib/db/projects';
import NewAssessmentClient from './client';

export const dynamic = 'force-dynamic';

export default async function NewAssessmentPage() {
  const projects = await getProjects();
  return <NewAssessmentClient projects={projects.map((p) => ({ id: p.id, name: p.name }))} />;
}
