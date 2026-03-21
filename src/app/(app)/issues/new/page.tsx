import { getAllAssessments } from '@/lib/db/assessments';
import { NewIssueGlobalClient } from './new-issue-global-client';

export const dynamic = 'force-dynamic';

export default async function NewIssuePage() {
  const assessments = await getAllAssessments();
  return <NewIssueGlobalClient assessments={assessments} />;
}
