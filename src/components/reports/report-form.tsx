'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { SectionEditor } from './section-editor';
import type { EditorSection } from './section-editor';
import type { Report, ReportSection } from '@/lib/db/reports';

interface ReportFormProps {
  /** When provided, the form is in edit mode */
  report?: Report;
  projects?: { id: string; name: string }[];
}

export function ReportForm({ report, projects = [] }: ReportFormProps) {
  const router = useRouter();
  const isEdit = !!report;

  // Parse existing content (API stores [{title, body}]) into editor format [{title, content}]
  const initialSections: EditorSection[] = (() => {
    if (!report) return [];
    try {
      const raw = JSON.parse(report.content) as ReportSection[];
      return raw.map((s) => ({ title: s.title, content: s.body }));
    } catch {
      return [];
    }
  })();

  const [title, setTitle] = useState(report?.title ?? '');
  const [type, setType] = useState<'executive' | 'detailed' | 'custom'>(report?.type ?? 'detailed');
  const [projectId, setProjectId] = useState(report?.project_id ?? projects[0]?.id ?? '');
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Map editor sections back to API format
    const content: ReportSection[] = sections.map((s) => ({ title: s.title, body: s.content }));

    setIsSubmitting(true);
    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/reports/${report.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, type, content }),
        });
      } else {
        res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId, title, type, content }),
        });
      }

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to save report');
        return;
      }

      toast.success(isEdit ? 'Report updated' : 'Report created');
      router.push(`/reports/${json.data.id}`);
      router.refresh();
    } catch {
      toast.error('Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left column: form fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 2026 Accessibility Report"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Report Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sections</Label>
            <SectionEditor sections={sections} onChange={setSections} />
          </div>
        </div>

        {/* Right column: reference info */}
        <aside className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Tips
            </h2>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>Add sections to structure your report.</li>
              <li>Each section has a title and body content.</li>
              <li>Markdown formatting is supported in section content.</li>
              <li>Published reports cannot be edited.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Report'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
