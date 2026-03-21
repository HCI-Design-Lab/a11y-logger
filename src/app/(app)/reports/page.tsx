export const dynamic = 'force-dynamic';

import { getReports } from '@/lib/db/reports';
import { ReportsListView } from '@/components/reports/reports-list-view';

export default async function ReportsPage() {
  const reports = await getReports();
  return <ReportsListView reports={reports} />;
}
