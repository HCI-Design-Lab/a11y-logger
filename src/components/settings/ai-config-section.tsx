'use client';

import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KNOWN_MODELS, AI_TASKS } from '@/lib/ai/models';

interface AIEnvSource {
  provider: string | null;
  apiKey: boolean;
  model: string | null;
  baseUrl: string | null;
}

interface AIConfigSectionProps {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  modelIssues?: string;
  modelVpat?: string;
  modelReports?: string;
  modelVpatReview?: string;
  reviewPassEnabled?: boolean;
  envSource?: AIEnvSource;
  onSave: (data: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    modelIssues: string;
    modelVpat: string;
    modelReports: string;
    modelVpatReview: string;
    reviewPassEnabled: boolean;
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

const needsApiKey = (p: string) =>
  ['openai', 'anthropic', 'google', 'openai-compatible'].includes(p);
const needsBaseUrl = (p: string) => ['ollama', 'openai-compatible'].includes(p);

// ─── TaskModelSelector ────────────────────────────────────────────────────────

interface TaskModelSelectorProps {
  id: string;
  label: string;
  description: string;
  provider: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function TaskModelSelector({
  id,
  label,
  description,
  provider,
  value,
  onChange,
  disabled,
}: TaskModelSelectorProps) {
  const knownModels = KNOWN_MODELS[provider] ?? [];
  const isCustomValue = value !== '' && !knownModels.some((m) => m.value === value);
  const [showOther, setShowOther] = useState(isCustomValue);

  const PROVIDER_DEFAULT = '__default__';
  const dropdownValue = showOther ? 'other' : value === '' ? PROVIDER_DEFAULT : value;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {knownModels.length > 0 ? (
        <>
          <Select
            value={dropdownValue}
            onValueChange={(v) => {
              if (v === 'other') {
                setShowOther(true);
                onChange('');
              } else if (v === PROVIDER_DEFAULT) {
                setShowOther(false);
                onChange('');
              } else {
                setShowOther(false);
                onChange(v);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger id={id} aria-label={label}>
              <SelectValue placeholder="Provider default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PROVIDER_DEFAULT}>Provider default</SelectItem>
              {knownModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
              <SelectItem value="other">Other…</SelectItem>
            </SelectContent>
          </Select>
          {showOther && (
            <Input
              id={`${id}-other`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="model-name"
              aria-label={`${label} custom model name`}
            />
          )}
        </>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="model-name"
          aria-label={label}
        />
      )}
    </div>
  );
}

// ─── AIConfigSection ──────────────────────────────────────────────────────────

export function AIConfigSection({
  provider = '',
  apiKey = '',
  baseUrl = '',
  modelIssues = '',
  modelVpat = '',
  modelReports = '',
  modelVpatReview = '',
  reviewPassEnabled = false,
  envSource,
  onSave,
}: AIConfigSectionProps) {
  const [selectedProvider, setSelectedProvider] = useState(envSource?.provider ?? provider);
  const [key, setKey] = useState(apiKey);
  const [selectedBaseUrl, setSelectedBaseUrl] = useState(envSource?.baseUrl ?? baseUrl);
  const [models, setModels] = useState({
    issues: modelIssues,
    vpat: modelVpat,
    reports: modelReports,
    vpat_review: modelVpatReview,
  });
  const [reviewEnabled, setReviewEnabled] = useState(reviewPassEnabled);
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
    if (loading) return;
    setLoading(true);
    try {
      await onSave({
        provider: selectedProvider,
        apiKey: key,
        baseUrl: selectedBaseUrl,
        modelIssues: models.issues,
        modelVpat: models.vpat,
        modelReports: models.reports,
        modelVpatReview: models.vpat_review,
        reviewPassEnabled: reviewEnabled,
      });
    } finally {
      setLoading(false);
    }
  };

  const showTaskModels = selectedProvider && selectedProvider !== 'none';

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

        {/* Provider */}
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
            Any API that follows the OpenAI chat format works here — Groq, Together AI, LM Studio,
            and most self-hosted models. Point it at the base URL, pick a model name, and it will
            behave the same as OpenAI.
          </p>
        )}

        {/* API Key */}
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

        {/* Base URL */}
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

        {/* Per-task model selectors */}
        {showTaskModels && (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Model per Task</p>
            <p className="text-xs text-muted-foreground">
              Choose which model to use for each task. Leave a task on &quot;Provider default&quot;
              to use the model your provider selects automatically.
            </p>

            {AI_TASKS.filter((t) => t.key !== 'vpat_review').map((task) => (
              <TaskModelSelector
                key={task.key}
                id={`ai-model-${task.key}`}
                label={task.label}
                description={task.description}
                provider={selectedProvider}
                value={models[task.key as keyof typeof models]}
                onChange={(v) => setModels((prev) => ({ ...prev, [task.key]: v }))}
              />
            ))}

            {/* AI Review Pass section */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">AI Review Pass</p>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="review-pass-toggle" className="text-sm">
                    Enable AI Review Pass
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    After generating a VPAT criterion row, a second AI call reviews the result and
                    corrects the conformance call if the evidence does not support it. This doubles
                    the number of AI calls for VPAT generation.
                  </p>
                </div>
                <Switch
                  id="review-pass-toggle"
                  checked={reviewEnabled}
                  onCheckedChange={setReviewEnabled}
                  aria-label="Enable AI Review Pass"
                />
              </div>

              {reviewEnabled && (
                <TaskModelSelector
                  id="ai-model-vpat-review"
                  label="AI Review Pass Model"
                  description="Used for the review critique pass. A smaller, faster model often works well here."
                  provider={selectedProvider}
                  value={models.vpat_review}
                  onChange={(v) => setModels((prev) => ({ ...prev, vpat_review: v }))}
                />
              )}
            </div>
          </div>
        )}

        <Button onClick={handleSave}>{loading ? 'Saving…' : 'Save Configuration'}</Button>
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
