import { getSetting } from '@/lib/db/settings';
import { getUsers } from '@/lib/db/users';
import { SettingsClient } from '@/components/settings/settings-client';

// This page reads from the local SQLite DB at request time — prevent static prerendering
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const aiProvider = (getSetting('ai_provider') as string) ?? '';
  // The API key is encrypted at rest — pass a masked placeholder if one exists
  const rawApiKey = getSetting('ai_api_key');
  const aiApiKey = rawApiKey ? '[REDACTED]' : '';
  const aiModel = (getSetting('ai_model') as string) ?? '';
  const aiBaseUrl = (getSetting('ai_base_url') as string) ?? '';
  const authEnabled = Boolean(getSetting('auth_enabled'));
  const users = await getUsers();

  const version = process.env.npm_package_version ?? '0.0.0';

  const aiEnvSource = {
    provider: process.env.AI_PROVIDER ?? null,
    apiKey: !!process.env.AI_API_KEY,
    model: process.env.AI_MODEL ?? null,
    baseUrl: process.env.AI_BASE_URL ?? null,
  };
  const hasAnyEnvOverride = Object.values(aiEnvSource).some(Boolean);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsClient
        aiProvider={aiProvider}
        aiApiKey={aiApiKey}
        aiModel={aiModel}
        aiBaseUrl={aiBaseUrl}
        aiEnvSource={hasAnyEnvOverride ? aiEnvSource : undefined}
        dbPath={process.env.DATABASE_PATH ?? './data/a11y-logger.db'}
        mediaPath="./data/media/"
        version={version}
        authEnabled={authEnabled}
        users={users}
      />
    </div>
  );
}
