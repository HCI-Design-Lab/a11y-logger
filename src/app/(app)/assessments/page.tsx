import { getAllAssessments } from '@/lib/db/assessments';
import { AssessmentsListView } from '@/components/assessments/assessments-list-view';

export const dynamic = 'force-dynamic';

export default async function AssessmentsPage() {
  const assessments = await getAllAssessments();
  return <AssessmentsListView assessments={assessments} />;
}
