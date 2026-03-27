'use client';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Save, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { WcagSelector } from './wcag-selector';
import { Section508Selector } from './section508-selector';
import { EuSelector } from './eu-selector';
import { TagInput } from './tag-input';
import { MediaUploader } from './media-uploader';
import { CreateIssueSchema } from '@/lib/validators/issues';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';
import type { Issue } from '@/lib/db/issues';

export interface AssessmentOption {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
}

interface IssueFormProps {
  issue?: Issue;
  projectId: string;
  assessmentOptions?: AssessmentOption[];
  onAssessmentChange?: (assessmentId: string, projectId: string) => void;
  onSubmit: (data: CreateIssueInput | UpdateIssueInput) => void;
  loading?: boolean;
  cancelHref?: string;
  externalButtons?: string;
}

export function IssueForm({
  issue,
  projectId,
  assessmentOptions,
  onAssessmentChange,
  onSubmit,
  loading,
  cancelHref,
  externalButtons,
}: IssueFormProps) {
  // AI assistance state — not part of the submitted form
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const uploadId = useMemo(() => issue?.id ?? crypto.randomUUID(), [issue?.id]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateIssueInput>({
    resolver: zodResolver(CreateIssueSchema),
    defaultValues: {
      title: issue?.title ?? '',
      description: issue?.description ?? '',
      severity: issue?.severity ?? 'medium',
      status: issue?.status ?? 'open',
      url: issue?.url ?? '',
      selector: issue?.selector ?? '',
      code_snippet: issue?.code_snippet ?? '',
      suggested_fix: issue?.suggested_fix ?? '',
      user_impact: issue?.user_impact ?? '',
      browser: issue?.browser ?? '',
      operating_system: issue?.operating_system ?? '',
      assistive_technology: issue?.assistive_technology ?? '',
      device_type: issue?.device_type ?? undefined,
      wcag_codes: issue?.wcag_codes ?? [],
      section_508_codes: issue?.section_508_codes ?? [],
      eu_codes: issue?.eu_codes ?? [],
      tags: issue?.tags ?? [],
      evidence_media: issue?.evidence_media ?? [],
    },
  });

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const current = getValues();
      const res = await fetch('/api/ai/generate-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_description: aiDescription,
          current: {
            title: current.title || null,
            description: current.description || null,
            severity: current.severity || null,
            user_impact: current.user_impact || null,
            suggested_fix: current.suggested_fix || null,
            wcag_codes: current.wcag_codes,
            section_508_codes: current.section_508_codes,
            eu_codes: current.eu_codes,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAiError(json.error ?? 'Failed to get AI suggestion');
        return;
      }

      const data = json.data as {
        title: string | null;
        description: string | null;
        severity: Issue['severity'] | null;
        user_impact: string | null;
        suggested_fix: string | null;
        wcag_codes: string[] | null;
        section_508_codes: string[] | null;
        eu_codes: string[] | null;
      };

      const opts = { shouldValidate: true, shouldDirty: true } as const;
      if (data.title) setValue('title', data.title, opts);
      if (data.description) setValue('description', data.description, opts);
      if (data.severity) setValue('severity', data.severity, opts);
      if (data.user_impact) setValue('user_impact', data.user_impact, opts);
      if (data.suggested_fix) setValue('suggested_fix', data.suggested_fix, opts);
      if (data.wcag_codes)
        setValue('wcag_codes', data.wcag_codes as CreateIssueInput['wcag_codes'], opts);
      if (data.section_508_codes)
        setValue(
          'section_508_codes',
          data.section_508_codes as CreateIssueInput['section_508_codes'],
          opts
        );
      if (data.eu_codes) setValue('eu_codes', data.eu_codes as CreateIssueInput['eu_codes'], opts);
    } catch {
      setAiError('Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} id={externalButtons}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: all form fields */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            {/* Assessment selector — shown only on the global new issue route */}
            {assessmentOptions && (
              <div className="space-y-1.5">
                <Label htmlFor="assessment-select">Assessment</Label>
                <Select
                  onValueChange={(value) => {
                    const option = assessmentOptions.find((a) => a.id === value);
                    if (option) onAssessmentChange?.(option.id, option.projectId);
                  }}
                >
                  <SelectTrigger id="assessment-select" aria-label="Assessment">
                    <SelectValue placeholder="Select an assessment…" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.projectName} / {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Assistance Section */}
            <div className="rounded-md border border-ai p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                You can enter a description here and press <strong>Generate with AI</strong> to have
                the rest of the issue filled out by the AI. For best results, include:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>
                  <strong>Component:</strong> What element is affected? (e.g. &ldquo;Search
                  button&rdquo;)
                </li>
                <li>
                  <strong>Location:</strong> Where does the issue occur? (e.g.
                  &ldquo;Homepage&rdquo;)
                </li>
                <li>
                  <strong>What&rsquo;s Happening:</strong> What is wrong? (e.g. &ldquo;Not focusable
                  via keyboard&rdquo;)
                </li>
                <li>
                  <strong>Expected Behavior (Optional):</strong> What is the expected behavior?
                </li>
              </ol>
              <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  AI assistance will only fill in fields you&rsquo;ve left empty; it will not
                  overwrite values you&rsquo;ve already entered.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ai_description">AI Assistance Description</Label>
                <Textarea
                  id="ai_description"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={4}
                  disabled={aiLoading}
                  placeholder="Example: The search button on the homepage is not operable via keyboard. It should be focusable and activated using the Enter key."
                />
              </div>

              {aiError && <p className="text-sm text-destructive">{aiError}</p>}

              <Button
                type="button"
                variant="ai"
                size="sm"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiDescription.trim()}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {aiLoading ? 'Generating…' : 'Generate with AI'}
              </Button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                disabled={aiLoading}
                aria-required="true"
                placeholder="e.g. Image missing alt text"
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={4}
                disabled={aiLoading}
                placeholder="Describe the accessibility issue"
              />
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity</Label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={aiLoading}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* User Impact */}
            <div className="space-y-1.5">
              <Label htmlFor="user_impact">User Impact</Label>
              <Textarea
                id="user_impact"
                {...register('user_impact')}
                rows={3}
                disabled={aiLoading}
                placeholder="Describe how this issue affects users, particularly those with disabilities"
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                {...register('url')}
                disabled={aiLoading}
                placeholder="https://example.com/page"
              />
              {errors.url && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.url.message}
                </p>
              )}
            </div>

            {/* Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="selector">Selector</Label>
              <Input
                id="selector"
                {...register('selector')}
                disabled={aiLoading}
                placeholder="e.g. #search-button or header nav .menu > li:nth-child(3) a"
                className="font-mono text-sm"
              />
            </div>

            {/* Code Snippet */}
            <div className="space-y-1.5">
              <Label htmlFor="code_snippet">Code Snippet</Label>
              <Textarea
                id="code_snippet"
                {...register('code_snippet')}
                rows={4}
                disabled={aiLoading}
                placeholder={`<button class="btn" aria-label="">...</button>`}
                className="font-mono text-sm"
              />
            </div>

            {/* Suggested Fix */}
            <div className="space-y-1.5">
              <Label htmlFor="suggested_fix">Suggested Fix</Label>
              <Textarea
                id="suggested_fix"
                {...register('suggested_fix')}
                rows={4}
                disabled={aiLoading}
                placeholder="Describe how to fix this issue"
              />
            </div>

            {/* Environment */}
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
              Environment
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="device_type">Device Type</Label>
              <Controller
                name="device_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                    disabled={aiLoading}
                  >
                    <SelectTrigger id="device_type">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="browser">Browser</Label>
              <Input id="browser" {...register('browser')} disabled={aiLoading} placeholder="e.g. Chrome 121" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operating_system">Operating System</Label>
              <Input
                id="operating_system"
                {...register('operating_system')}
                disabled={aiLoading}
                placeholder="e.g. macOS 14"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistive_technology">Assistive Technology</Label>
              <Input
                id="assistive_technology"
                {...register('assistive_technology')}
                disabled={aiLoading}
                placeholder="e.g. VoiceOver, NVDA"
              />
            </div>

            {/* WCAG Criteria */}
            <div className="space-y-1.5">
              <Label>WCAG Criteria</Label>
              <Controller
                name="wcag_codes"
                control={control}
                render={({ field }) => (
                  <WcagSelector
                    selected={(field.value ?? []) as string[]}
                    onChange={field.onChange}
                    disabled={aiLoading}
                  />
                )}
              />
            </div>

            {/* Section 508 Criteria */}
            <div className="space-y-1.5">
              <Label>Section 508 Criteria</Label>
              <Controller
                name="section_508_codes"
                control={control}
                render={({ field }) => (
                  <Section508Selector
                    selected={(field.value ?? []) as string[]}
                    onChange={field.onChange}
                    disabled={aiLoading}
                  />
                )}
              />
            </div>

            {/* EU EN 301 549 Criteria */}
            <div className="space-y-1.5">
              <Label>EU EN 301 549 Criteria</Label>
              <Controller
                name="eu_codes"
                control={control}
                render={({ field }) => (
                  <EuSelector
                    selected={(field.value ?? []) as string[]}
                    onChange={field.onChange}
                    disabled={aiLoading}
                  />
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput tags={(field.value ?? []) as string[]} onChange={field.onChange} disabled={aiLoading} />
                )}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={aiLoading}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {!externalButtons && (
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || aiLoading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving…' : 'Save Issue'}
                </Button>
                {cancelHref && (
                  <Button asChild variant="cancel">
                    <Link href={cancelHref}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Attachments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Screenshots &amp; Videos
              </p>
              <Controller
                name="evidence_media"
                control={control}
                render={({ field }) => (
                  <MediaUploader
                    projectId={projectId}
                    issueId={uploadId}
                    urls={(field.value ?? []) as string[]}
                    onUpload={(url) => {
                      const current = (getValues('evidence_media') as string[]) ?? [];
                      field.onChange([...current, url]);
                    }}
                    onRemove={(url) => field.onChange((field.value ?? []).filter((u) => u !== url))}
                    disabled={aiLoading}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
