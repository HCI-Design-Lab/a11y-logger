'use client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIConfigSection } from './ai-config-section';
import { DataManagementSection } from './data-management-section';
import { AuthToggleSection } from './auth-toggle-section';

interface SettingsClientProps {
  aiProvider: string;
  aiApiKey: string;
  dbPath: string;
  mediaPath: string;
  version: string;
  authEnabled: boolean;
}

export function SettingsClient({
  aiProvider,
  aiApiKey,
  dbPath,
  mediaPath,
  version,
  authEnabled,
}: SettingsClientProps) {
  const handleSaveAI = async (data: { provider: string; apiKey: string }) => {
    try {
      const providerRes = await fetch('/api/settings/ai_provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: data.provider }),
      });
      const providerJson = await providerRes.json();
      if (!providerJson.success) throw new Error(providerJson.error);

      // Only update API key if it's not the redacted placeholder
      if (data.apiKey !== '[REDACTED]') {
        const keyRes = await fetch('/api/settings/ai_api_key', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: data.apiKey }),
        });
        const keyJson = await keyRes.json();
        if (!keyJson.success) throw new Error(keyJson.error);
      }

      toast.success('AI configuration saved');
    } catch {
      toast.error('Failed to save AI configuration');
    }
  };

  return (
    <Tabs defaultValue="ai">
      <TabsList>
        <TabsTrigger value="ai">AI Configuration</TabsTrigger>
        <TabsTrigger value="data">Data Management</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>
      <TabsContent value="ai" className="mt-6">
        <AIConfigSection provider={aiProvider} apiKey={aiApiKey} onSave={handleSaveAI} />
      </TabsContent>
      <TabsContent value="data" className="mt-6">
        <DataManagementSection dbPath={dbPath} mediaPath={mediaPath} />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <AuthToggleSection authEnabled={authEnabled} />
      </TabsContent>
      <TabsContent value="about" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>About A11y Logger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">{version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                AGPL-3.0
              </a>
            </div>
            <p className="text-muted-foreground pt-2">
              A11y Logger is an open-source, offline-first accessibility auditing tool. No accounts
              or cloud services required.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
