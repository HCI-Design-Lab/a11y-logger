import { getAllAssessments } from '@/lib/db/assessments';
import { AssessmentsListView } from '@/components/assessments/assessments-list-view';

export const dynamic = 'force-dynamic';

export default function AssessmentsPage() {
  const assessments = getAllAssessments();
  return <AssessmentsListView assessments={assessments} />;
}
