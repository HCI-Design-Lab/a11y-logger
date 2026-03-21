export const dynamic = 'force-dynamic';

import { getVpatsWithProgress } from '@/lib/db/vpats';
import { VpatsListView } from '@/components/vpats/vpats-list-view';

export default async function VpatsPage() {
  const vpats = await getVpatsWithProgress();
  return <VpatsListView vpats={vpats} />;
}
