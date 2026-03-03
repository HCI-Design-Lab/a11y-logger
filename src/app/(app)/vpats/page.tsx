export const dynamic = 'force-dynamic';

import { getVpats } from '@/lib/db/vpats';
import { VpatsListView } from '@/components/vpats/vpats-list-view';

export default function VpatsPage() {
  const vpats = getVpats();
  return <VpatsListView vpats={vpats} />;
}
