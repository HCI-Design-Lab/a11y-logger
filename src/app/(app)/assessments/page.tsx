import { getAllAssessments } from '@/lib/db/assessments';
import { AllAssessmentsTable } from '@/components/assessments/all-assessments-table';

export const dynamic = 'force-dynamic';

export default function AssessmentsPage() {
  const assessments = getAllAssessments();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assessments</h1>
      <AllAssessmentsTable assessments={assessments} />
    </div>
  );
}
