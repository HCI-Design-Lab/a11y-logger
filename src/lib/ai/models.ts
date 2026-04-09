// src/lib/ai/models.ts

export const KNOWN_MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o3-mini', label: 'o3 Mini' },
    { value: 'o1-mini', label: 'o1 Mini' },
  ],
  anthropic: [
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
};

export const AI_TASKS = [
  {
    key: 'issues' as const,
    settingKey: 'ai_model_issues',
    label: 'Issue Analysis',
    description:
      'Used when analyzing pasted issue text to extract title, severity, WCAG codes, and suggested fixes.',
  },
  {
    key: 'vpat' as const,
    settingKey: 'ai_model_vpat',
    label: 'VPAT Generation',
    description:
      'Used when generating conformance remarks and suggested conformance levels for VPAT criterion rows.',
  },
  {
    key: 'reports' as const,
    settingKey: 'ai_model_reports',
    label: 'Report Writing',
    description:
      'Used when generating executive summaries and narrative sections in accessibility audit reports.',
  },
  {
    key: 'vpat_review' as const,
    settingKey: 'ai_model_vpat_review',
    label: 'AI Review Pass',
    description:
      'Used for the optional second critique pass on VPAT generation. Reviews the first result and corrects the conformance call if the evidence does not support it.',
  },
] as const;

export type AITask = (typeof AI_TASKS)[number]['key'];

export const TASK_MODEL_SETTINGS: Record<AITask, string> = Object.fromEntries(
  AI_TASKS.map((t) => [t.key, t.settingKey])
) as Record<AITask, string>;
