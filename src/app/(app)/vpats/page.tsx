export const dynamic = 'force-dynamic';

import { getVpatsWithProgress } from '@/lib/db/vpats';
import { VpatsListView } from '@/components/vpats/vpats-list-view';

export default function VpatsPage() {
  const vpats = getVpatsWithProgress();
  return <VpatsListView vpats={vpats} />;
}
