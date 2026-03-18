'use client';
import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { WcagSelector } from './wcag-selector';
import { Section508Selector } from './section508-selector';
import { EuSelector } from './eu-selector';
import { TagInput } from './tag-input';
import { MediaUploader } from './media-uploader';
import type { Issue } from '@/lib/db/issues';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';

interface IssueFormProps {
  issue?: Issue;
  projectId: string;
  onSubmit: (data: CreateIssueInput | UpdateIssueInput) => void;
  loading?: boolean;
}

export function IssueForm({ issue, projectId, onSubmit, loading }: IssueFormProps) {
  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [severity, setSeverity] = useState<Issue['severity']>(issue?.severity ?? 'medium');
  const [userImpact, setUserImpact] = useState(issue?.user_impact ?? '');
  const [url, setUrl] = useState(issue?.url ?? '');
  const [selector, setSelector] = useState(issue?.selector ?? '');
  const [codeSnippet, setCodeSnippet] = useState(issue?.code_snippet ?? '');
  const [suggestedFix, setSuggestedFix] = useState(issue?.suggested_fix ?? '');
  const [status, setStatus] = useState<Issue['status']>(issue?.status ?? 'open');
  const [wcagCodes, setWcagCodes] = useState<string[]>(issue?.wcag_codes ?? []);
  const [section508Codes, setSection508Codes] = useState<string[]>(issue?.section_508_codes ?? []);
  const [euCodes, setEuCodes] = useState<string[]>(issue?.eu_codes ?? []);
  const [tags, setTags] = useState<string[]>(issue?.tags ?? []);
  const [deviceType, setDeviceType] = useState<Issue['device_type'] | ''>(issue?.device_type ?? '');
  const [browser, setBrowser] = useState(issue?.browser ?? '');
  const [os, setOs] = useState(issue?.operating_system ?? '');
  const [assistiveTech, setAssistiveTech] = useState(issue?.assistive_technology ?? '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(issue?.evidence_media ?? []);
  const uploadId = useMemo(() => issue?.id ?? crypto.randomUUID(), [issue?.id]);

  // AI state
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_description: aiDescription,
          current: {
            title: title || null,
            description: description || null,
            severity: severity || null,
            user_impact: userImpact || null,
            suggested_fix: suggestedFix || null,
            wcag_codes: wcagCodes,
            section_508_codes: section508Codes,
            eu_codes: euCodes,
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

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.severity) setSeverity(data.severity);
      if (data.user_impact) setUserImpact(data.user_impact);
      if (data.suggested_fix) setSuggestedFix(data.suggested_fix);
      if (data.wcag_codes) setWcagCodes(data.wcag_codes);
      if (data.section_508_codes) setSection508Codes(data.section_508_codes);
      if (data.eu_codes) setEuCodes(data.eu_codes);
    } catch {
      setAiError('Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateIssueInput = {
      title,
      description: description || undefined,
      url: url || undefined,
      severity,
      status,
      wcag_codes: wcagCodes as CreateIssueInput['wcag_codes'],
      section_508_codes: section508Codes as CreateIssueInput['section_508_codes'],
      eu_codes: euCodes as CreateIssueInput['eu_codes'],
      tags,
      user_impact: userImpact || undefined,
      selector: selector || undefined,
      code_snippet: codeSnippet || undefined,
      suggested_fix: suggestedFix || undefined,
      device_type: (deviceType as Issue['device_type']) || undefined,
      browser: browser || undefined,
      operating_system: os || undefined,
      assistive_technology: assistiveTech || undefined,
      evidence_media: mediaUrls,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: all form fields */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            {/* AI Assistance Section */}
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
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
                  placeholder="Example: The search button on the homepage is not operable via keyboard. It should be focusable and activated using the Enter key."
                />
              </div>

              {aiError && <p className="text-sm text-destructive">{aiError}</p>}

              <Button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiDescription.trim()}
              >
                {aiLoading ? 'Generating…' : 'Generate with AI'}
              </Button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Image missing alt text"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the accessibility issue"
              />
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as Issue['severity'])}>
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
            </div>

            {/* User Impact */}
            <div className="space-y-1.5">
              <Label htmlFor="user_impact">User Impact</Label>
              <Textarea
                id="user_impact"
                value={userImpact}
                onChange={(e) => setUserImpact(e.target.value)}
                rows={3}
                placeholder="Describe how this issue affects users, particularly those with disabilities"
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/page"
              />
            </div>

            {/* Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="selector">Selector</Label>
              <Input
                id="selector"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="e.g. #search-button or header nav .menu > li:nth-child(3) a"
                className="font-mono text-sm"
              />
            </div>

            {/* Code Snippet */}
            <div className="space-y-1.5">
              <Label htmlFor="code_snippet">Code Snippet</Label>
              <Textarea
                id="code_snippet"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={4}
                placeholder={`<button class="btn" aria-label="">...</button>`}
                className="font-mono text-sm"
              />
            </div>

            {/* Suggested Fix */}
            <div className="space-y-1.5">
              <Label htmlFor="suggested_fix">Suggested Fix</Label>
              <Textarea
                id="suggested_fix"
                value={suggestedFix}
                onChange={(e) => setSuggestedFix(e.target.value)}
                rows={4}
                placeholder="Describe how to fix this issue"
              />
            </div>

            {/* Environment */}
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
              Environment
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="device_type">Device Type</Label>
              <Select
                value={deviceType || 'none'}
                onValueChange={(v) =>
                  setDeviceType(v === 'none' ? '' : (v as Issue['device_type']))
                }
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="browser">Browser</Label>
              <Input
                id="browser"
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                placeholder="e.g. Chrome 121"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operating_system">Operating System</Label>
              <Input
                id="operating_system"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="e.g. macOS 14"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistive_technology">Assistive Technology</Label>
              <Input
                id="assistive_technology"
                value={assistiveTech}
                onChange={(e) => setAssistiveTech(e.target.value)}
                placeholder="e.g. VoiceOver, NVDA"
              />
            </div>

            {/* WCAG Criteria */}
            <div className="space-y-1.5">
              <Label>WCAG Criteria</Label>
              <WcagSelector selected={wcagCodes} onChange={setWcagCodes} />
            </div>

            {/* Section 508 Criteria */}
            <div className="space-y-1.5">
              <Label>Section 508 Criteria</Label>
              <Section508Selector selected={section508Codes} onChange={setSection508Codes} />
            </div>

            {/* EU EN 301 549 Criteria */}
            <div className="space-y-1.5">
              <Label>EU EN 301 549 Criteria</Label>
              <EuSelector selected={euCodes} onChange={setEuCodes} />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Issue['status'])}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Issue'}
            </Button>
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
              <MediaUploader
                projectId={projectId}
                issueId={uploadId}
                urls={mediaUrls}
                onUpload={(url) => setMediaUrls((prev) => [...prev, url])}
                onRemove={(url) => setMediaUrls((prev) => prev.filter((u) => u !== url))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
