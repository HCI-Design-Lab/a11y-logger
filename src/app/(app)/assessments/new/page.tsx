import { getProjects } from '@/lib/db/projects';
import NewAssessmentClient from './client';

export const dynamic = 'force-dynamic';

export default function NewAssessmentPage() {
  const projects = getProjects();
  return <NewAssessmentClient projects={projects.map((p) => ({ id: p.id, name: p.name }))} />;
}
