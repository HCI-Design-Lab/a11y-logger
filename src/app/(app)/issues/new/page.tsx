import { getAllAssessments } from '@/lib/db/assessments';
import { NewIssueGlobalClient } from './new-issue-global-client';

export const dynamic = 'force-dynamic';

export default function NewIssuePage() {
  const assessments = getAllAssessments();
  return <NewIssueGlobalClient assessments={assessments} />;
}
