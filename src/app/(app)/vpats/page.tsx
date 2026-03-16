export const dynamic = 'force-dynamic';

import { getVpatsWithProject } from '@/lib/db/vpats';
import { VpatsListView } from '@/components/vpats/vpats-list-view';

export default function VpatsPage() {
  const vpats = getVpatsWithProject();
  return <VpatsListView vpats={vpats} />;
}
