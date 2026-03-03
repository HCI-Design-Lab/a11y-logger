import { getAllIssues } from '@/lib/db/issues';
import { AllIssuesTable } from '@/components/issues/all-issues-table';

export const dynamic = 'force-dynamic';

export default function IssuesPage() {
  const issues = getAllIssues();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Issues</h1>
      <AllIssuesTable issues={issues} />
    </div>
  );
}
