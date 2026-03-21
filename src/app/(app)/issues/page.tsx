import { getAllIssues } from '@/lib/db/issues';
import { IssuesListView } from '@/components/issues/issues-list-view';

export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
  const issues = await getAllIssues();
  return <IssuesListView issues={issues} />;
}
