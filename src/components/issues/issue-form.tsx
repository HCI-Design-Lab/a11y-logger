'use client';
import { useState } from 'react';
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
import { WcagSelector } from './wcag-selector';
import { TagInput } from './tag-input';
import type { Issue } from '@/lib/db/issues';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';

interface IssueFormProps {
  issue?: Issue;
  onSubmit: (data: CreateIssueInput | UpdateIssueInput) => void;
  loading?: boolean;
}

export function IssueForm({ issue, onSubmit, loading }: IssueFormProps) {
  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [url, setUrl] = useState(issue?.url ?? '');
  const [severity, setSeverity] = useState<Issue['severity']>(issue?.severity ?? 'medium');
  const [status, setStatus] = useState<Issue['status']>(issue?.status ?? 'open');
  const [wcagCodes, setWcagCodes] = useState<string[]>(issue?.wcag_codes ?? []);
  const [tags, setTags] = useState<string[]>(issue?.tags ?? []);
  const [deviceType, setDeviceType] = useState<Issue['device_type'] | ''>(issue?.device_type ?? '');
  const [browser, setBrowser] = useState(issue?.browser ?? '');
  const [os, setOs] = useState(issue?.operating_system ?? '');
  const [assistiveTech, setAssistiveTech] = useState(issue?.assistive_technology ?? '');

  // AI suggest state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateIssueInput = {
      title,
      description: description || undefined,
      url: url || undefined,
      severity,
      status,
      wcag_codes: wcagCodes as CreateIssueInput['wcag_codes'],
      tags,
      device_type: (deviceType as Issue['device_type']) || undefined,
      browser: browser || undefined,
      operating_system: os || undefined,
      assistive_technology: assistiveTech || undefined,
    };
    onSubmit(data);
  };

  const handleAiSuggest = async () => {
    if (!title.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiConfidence(null);

    try {
      const res = await fetch('/api/ai/suggest-wcag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errMsg = json.error ?? 'Failed to get AI suggestion';
        setAiError(errMsg);
        return;
      }

      const { codes, confidence } = json.data as { codes: string[]; confidence: number };
      setWcagCodes(codes);
      setAiConfidence(confidence);
    } catch {
      setAiError('Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>WCAG Criteria</Label>
              <div className="flex items-center gap-2">
                {aiConfidence !== null && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(aiConfidence * 100)}% confidence
                  </span>
                )}
                {aiError && <span className="text-xs text-destructive">{aiError}</span>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiSuggest}
                  disabled={aiLoading || !title.trim()}
                >
                  {aiLoading ? 'Suggesting…' : 'AI Suggest'}
                </Button>
              </div>
            </div>
            <WcagSelector selected={wcagCodes} onChange={setWcagCodes} />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>

        {/* Right column — environment */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Environment
          </h3>

          <div className="space-y-1.5">
            <Label htmlFor="device_type">Device Type</Label>
            <Select
              value={deviceType || 'none'}
              onValueChange={(v) => setDeviceType(v === 'none' ? '' : (v as Issue['device_type']))}
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
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save Issue'}
      </Button>
    </form>
  );
}
