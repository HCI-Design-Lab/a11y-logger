'use client';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
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
import { AiSuggestionPanel } from './ai-suggestion-panel';
import { StandardsCriteriaFields } from './standards-criteria-fields';
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

/**
 * IssueForm — Create or edit an accessibility issue.
 *
 * Handles WCAG / Section 508 / EN 301 549 criterion selection, media
 * attachment, and optional AI-assisted field population via the
 * `/api/ai/generate-issue` endpoint. When `issue` is provided the form
 * operates in edit mode and pre-populates every field from the existing
 * record.
 *
 * Buttons can be rendered inline (default) or hoisted to an external
 * container by passing `externalButtons` (the HTML id of the target form).
 * This lets page layouts place Save/Cancel outside the card without
 * duplicating the submit handler.
 *
 * @param issue - Existing issue record for edit mode; omit for create mode.
 * @param projectId - Project that owns the issue, used for media upload paths.
 * @param assessmentOptions - When provided, shows a top-level assessment
 *   selector (used on the global /issues/new route where the assessment is
 *   not known from the URL).
 * @param onAssessmentChange - Notifies the parent when the user picks a
 *   different assessment so it can update its own state (e.g. project context).
 * @param onSubmit - Called with validated form data on submission.
 * @param loading - Disables the submit button while the parent is persisting.
 * @param cancelHref - Route to navigate to when the user cancels.
 * @param externalButtons - HTML form id that wires an external submit button
 *   to this form element; when set the inline button row is hidden.
 */
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
  const t = useTranslations('issues.form');
  const tAttachments = useTranslations('issues.attachments');

  // AI assistance state — not part of the submitted form
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Stable upload ID for the lifetime of the form: reuse the existing issue
  // ID in edit mode so media is written to the correct directory, or generate
  // a UUID upfront in create mode so uploads can proceed before the record exists.
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
      // Send existing field values alongside the free-text description so the
      // AI can fill gaps without overwriting fields the user has already set.
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

      // Merge AI suggestions into RHF without resetting untouched fields.
      // shouldDirty marks the form as changed so the save button activates.
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
      <p role="status" aria-live="polite" className="sr-only">
        {aiLoading ? tAttachments('ai_status_message') : ''}
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: all form fields */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            {/* Assessment selector — shown only on the global new issue route */}
            {assessmentOptions && (
              <div className="space-y-1.5">
                <Label htmlFor="assessment-select">{t('assessment_label')}</Label>
                <Select
                  onValueChange={(value) => {
                    const option = assessmentOptions.find((a) => a.id === value);
                    if (option) onAssessmentChange?.(option.id, option.projectId);
                  }}
                >
                  <SelectTrigger id="assessment-select" aria-label={t('assessment_label')}>
                    <SelectValue placeholder={t('assessment_placeholder')} />
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
            <AiSuggestionPanel
              aiDescription={aiDescription}
              onDescriptionChange={setAiDescription}
              onGenerate={handleAiGenerate}
              aiLoading={aiLoading}
              aiError={aiError}
            />

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                {t('title_label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                disabled={aiLoading}
                aria-required="true"
                placeholder={t('title_placeholder')}
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">{t('description_label')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={4}
                disabled={aiLoading}
                placeholder={t('description_placeholder')}
              />
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <Label htmlFor="severity">{t('severity_label')}</Label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={aiLoading}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">{t('severity_options.critical')}</SelectItem>
                      <SelectItem value="high">{t('severity_options.high')}</SelectItem>
                      <SelectItem value="medium">{t('severity_options.medium')}</SelectItem>
                      <SelectItem value="low">{t('severity_options.low')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* User Impact */}
            <div className="space-y-1.5">
              <Label htmlFor="user_impact">{t('user_impact_label')}</Label>
              <Textarea
                id="user_impact"
                {...register('user_impact')}
                rows={3}
                disabled={aiLoading}
                placeholder={t('user_impact_placeholder')}
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url">{t('url_label')}</Label>
              <Input
                id="url"
                type="url"
                {...register('url')}
                disabled={aiLoading}
                placeholder={t('url_placeholder')}
              />
              {errors.url && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.url.message}
                </p>
              )}
            </div>

            {/* Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="selector">{t('selector_label')}</Label>
              <Input
                id="selector"
                {...register('selector')}
                disabled={aiLoading}
                placeholder={t('selector_placeholder')}
                className="font-mono text-sm"
              />
            </div>

            {/* Code Snippet */}
            <div className="space-y-1.5">
              <Label htmlFor="code_snippet">{t('code_snippet_label')}</Label>
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
              <Label htmlFor="suggested_fix">{t('suggested_fix_label')}</Label>
              <Textarea
                id="suggested_fix"
                {...register('suggested_fix')}
                rows={4}
                disabled={aiLoading}
                placeholder={t('suggested_fix_label')}
              />
            </div>

            {/* Environment */}
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
              {t('environment_heading')}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="device_type">{t('device_type_label')}</Label>
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
                      <SelectValue placeholder={t('device_type_label')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('device_type_options.none')}</SelectItem>
                      <SelectItem value="desktop">{t('device_type_options.desktop')}</SelectItem>
                      <SelectItem value="mobile">{t('device_type_options.mobile')}</SelectItem>
                      <SelectItem value="tablet">{t('device_type_options.tablet')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="browser">{t('browser_label')}</Label>
              <Input
                id="browser"
                {...register('browser')}
                disabled={aiLoading}
                placeholder={t('browser_placeholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operating_system">{t('os_label')}</Label>
              <Input
                id="operating_system"
                {...register('operating_system')}
                disabled={aiLoading}
                placeholder={t('os_placeholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistive_technology">{t('at_label')}</Label>
              <Input
                id="assistive_technology"
                {...register('assistive_technology')}
                disabled={aiLoading}
                placeholder={t('at_placeholder')}
              />
            </div>

            {/* WCAG / Section 508 / EU EN 301 549 Criteria */}
            <StandardsCriteriaFields control={control} disabled={aiLoading} />

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>{t('tags_label')}</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    tags={(field.value ?? []) as string[]}
                    onChange={field.onChange}
                    disabled={aiLoading}
                  />
                )}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">{t('status_label')}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={aiLoading}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('status_options.open')}</SelectItem>
                      <SelectItem value="resolved">{t('status_options.resolved')}</SelectItem>
                      <SelectItem value="wont_fix">{t('status_options.wont_fix')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Buttons are only rendered here when the caller has not opted to
                render them in an external container via the form= attribute. */}
            {!externalButtons && (
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || aiLoading}>
                  <Save className="h-4 w-4" />
                  {loading ? t('save_button_loading') : t('save_button')}
                </Button>
                {cancelHref && (
                  <Button asChild variant="cancel">
                    <Link href={cancelHref}>
                      <X className="h-4 w-4" />
                      {t('cancel_button')}
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
                {tAttachments('heading')}
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
