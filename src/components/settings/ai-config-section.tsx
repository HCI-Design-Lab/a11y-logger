'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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

interface AIConfigSectionProps {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
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
  onSave,
}: AIConfigSectionProps) {
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [key, setKey] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(model);
  const [selectedBaseUrl, setSelectedBaseUrl] = useState(baseUrl);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <div className="space-y-1.5">
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
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

        {needsApiKey(selectedProvider) && (
          <div className="space-y-1.5">
            <Label htmlFor="api-key">
              API Key{' '}
              {selectedProvider === 'openai-compatible' && (
                <span className="text-muted-foreground">(optional)</span>
              )}
            </Label>
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
          </div>
        )}

        {needsBaseUrl(selectedProvider) && (
          <div className="space-y-1.5">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              type="url"
              value={selectedBaseUrl}
              onChange={(e) => setSelectedBaseUrl(e.target.value)}
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
            <Label htmlFor="ai-model">Model Name</Label>
            <Input
              id="ai-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder={MODEL_PLACEHOLDERS[selectedProvider] ?? 'model-name'}
            />
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading || !selectedProvider || selectedProvider === 'none'}
        >
          {loading ? 'Saving…' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}
