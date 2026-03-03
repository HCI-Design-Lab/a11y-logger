import { getAllIssues } from '@/lib/db/issues';
import { IssuesListView } from '@/components/issues/issues-list-view';

export const dynamic = 'force-dynamic';

export default function IssuesPage() {
  const issues = getAllIssues();
  return <IssuesListView issues={issues} />;
}
