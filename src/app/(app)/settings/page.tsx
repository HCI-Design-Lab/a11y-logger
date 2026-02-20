import { getSetting } from '@/lib/db/settings';
import { SettingsClient } from '@/components/settings/settings-client';

// This page reads from the local SQLite DB at request time — prevent static prerendering
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const aiProvider = (getSetting('ai_provider') as string) ?? '';
  // The API key is encrypted at rest — pass a masked placeholder if one exists
  const rawApiKey = getSetting('ai_api_key');
  const aiApiKey = rawApiKey ? '[REDACTED]' : '';
  const authEnabled = Boolean(getSetting('auth_enabled'));

  const version = process.env.npm_package_version ?? '0.0.0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsClient
        aiProvider={aiProvider}
        aiApiKey={aiApiKey}
        dbPath={process.env.DATABASE_PATH ?? './data/a11y-logger.db'}
        mediaPath="./data/media/"
        version={version}
        authEnabled={authEnabled}
      />
    </div>
  );
}
