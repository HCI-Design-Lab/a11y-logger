export const dynamic = 'force-dynamic';

import { getReports } from '@/lib/db/reports';
import { ReportsListView } from '@/components/reports/reports-list-view';

export default function ReportsPage() {
  const reports = getReports();
  return <ReportsListView reports={reports} />;
}
