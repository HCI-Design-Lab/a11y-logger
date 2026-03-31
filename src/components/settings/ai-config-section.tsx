'use client';
import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIEnvSource {
  provider: string | null;
  apiKey: boolean;
  model: string | null;
  baseUrl: string | null;
}

interface AIConfigSectionProps {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  envSource?: AIEnvSource;
  onSave: (data: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
  }) => Promise<void>;
}

const PROVIDERS = [
  { value: 'none', label: 'None' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'openai-compatible', label: 'OpenAI-compatible (custom)' },
];

const MODEL_PLACEHOLDERS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  google: 'gemini-2.0-flash',
  ollama: 'llama3.2',
  'openai-compatible': 'model-name',
};

const needsApiKey = (p: string) =>
  ['openai', 'anthropic', 'google', 'openai-compatible'].includes(p);
const needsBaseUrl = (p: string) => ['ollama', 'openai-compatible'].includes(p);
const needsModel = (p: string) => ['ollama', 'openai-compatible'].includes(p);

export function AIConfigSection({
  provider = '',
  apiKey = '',
  model = '',
  baseUrl = '',
  envSource,
  onSave,
}: AIConfigSectionProps) {
  const [selectedProvider, setSelectedProvider] = useState(envSource?.provider ?? provider);
  const [key, setKey] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(envSource?.model ?? model);
  const [selectedBaseUrl, setSelectedBaseUrl] = useState(envSource?.baseUrl ?? baseUrl);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasEnvOverride = !!(
    envSource?.provider ||
    envSource?.apiKey ||
    envSource?.model ||
    envSource?.baseUrl
  );
  const providerFromEnv = !!envSource?.provider;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        provider: selectedProvider,
        apiKey: key,
        model: selectedModel,
        baseUrl: selectedBaseUrl,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>
          Configure your AI provider to enable AI-assisted features. Supports cloud providers
          (OpenAI, Anthropic, Google Gemini) and local offline models via Ollama. Your API key is
          stored locally and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasEnvOverride && (
          <div
            role="alert"
            className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Some settings are controlled by environment variables and are read-only here. Remove
              the corresponding environment variables to manage them from this page.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ai-provider">
            AI Provider
            {providerFromEnv && <EnvBadge />}
          </Label>
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            disabled={providerFromEnv}
          >
            <SelectTrigger id="ai-provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProvider === 'openai-compatible' && (
          <p className="text-sm text-muted-foreground">
            Any API that follows the OpenAI chat format works here. That includes Groq, Together AI,
            LM Studio, and most self-hosted models. Point it at the base URL, pick a model name, and
            it will behave the same as OpenAI.
          </p>
        )}

        {needsApiKey(selectedProvider) && (
          <div className="space-y-1.5">
            <Label htmlFor="api-key">
              API Key{' '}
              {selectedProvider === 'openai-compatible' && (
                <span className="text-muted-foreground">(optional)</span>
              )}
              {envSource?.apiKey && <EnvBadge />}
            </Label>
            {envSource?.apiKey ? (
              <p className="text-sm text-muted-foreground">Set via environment variable</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        )}

        {needsBaseUrl(selectedProvider) && (
          <div className="space-y-1.5">
            <Label htmlFor="base-url">
              Base URL
              {envSource?.baseUrl && <EnvBadge />}
            </Label>
            <Input
              id="base-url"
              type="url"
              value={selectedBaseUrl}
              onChange={(e) => setSelectedBaseUrl(e.target.value)}
              disabled={!!envSource?.baseUrl}
              placeholder={
                selectedProvider === 'ollama'
                  ? 'http://localhost:11434/v1'
                  : 'https://api.example.com/v1'
              }
            />
          </div>
        )}

        {needsModel(selectedProvider) && (
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">
              Model Name
              {envSource?.model && <EnvBadge />}
            </Label>
            <Input
              id="ai-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!!envSource?.model}
              placeholder={MODEL_PLACEHOLDERS[selectedProvider] ?? 'model-name'}
            />
          </div>
        )}

        <Button onClick={handleSave} disabled={loading || !selectedProvider || providerFromEnv}>
          {loading ? 'Saving…' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}

function EnvBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
      env
    </span>
  );
}
