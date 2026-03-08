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
import type { Assessment } from '@/lib/db/assessments';

export interface AssessmentFormData {
  name: string;
  description: string;
  test_date_start: string;
  test_date_end: string;
  status: 'planning' | 'in_progress' | 'completed';
  project_id?: string;
}

interface AssessmentFormProps {
  assessment?: Assessment;
  onSubmit: (data: AssessmentFormData) => void;
  loading?: boolean;
  projects?: { id: string; name: string }[];
  defaultProjectId?: string;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  // ISO datetime string → date string (YYYY-MM-DD)
  return iso.slice(0, 10);
}

export function AssessmentForm({
  assessment,
  onSubmit,
  loading,
  projects,
  defaultProjectId,
}: AssessmentFormProps) {
  const [name, setName] = useState(assessment?.name ?? '');
  const [description, setDescription] = useState(assessment?.description ?? '');
  const [testDateStart, setTestDateStart] = useState(toDateInputValue(assessment?.test_date_start));
  const [testDateEnd, setTestDateEnd] = useState(toDateInputValue(assessment?.test_date_end));
  const [status, setStatus] = useState<'planning' | 'in_progress' | 'completed'>(
    assessment?.status ?? 'planning'
  );
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      test_date_start: testDateStart,
      test_date_end: testDateEnd,
      status,
      project_id: projectId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {projects && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id">Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="project_id">
              <SelectValue placeholder="Select a project" />
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
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Mobile App Q1 Audit"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of this assessment"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="test_date_start">Start Date</Label>
          <Input
            id="test_date_start"
            type="date"
            value={testDateStart}
            onChange={(e) => setTestDateStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="test_date_end">End Date</Label>
          <Input
            id="test_date_end"
            type="date"
            value={testDateEnd}
            onChange={(e) => setTestDateEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save Assessment'}
      </Button>
    </form>
  );
}
