'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
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
import { AssessmentFormSchema, type AssessmentFormData } from '@/lib/validators/assessments';

interface AssessmentFormProps {
  assessment?: Assessment;
  onSubmit: (data: AssessmentFormData) => void;
  loading?: boolean;
  projects?: { id: string; name: string }[];
  defaultProjectId?: string;
  cancelHref?: string;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function AssessmentForm({
  assessment,
  onSubmit,
  loading,
  projects,
  defaultProjectId,
  cancelHref,
}: AssessmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(AssessmentFormSchema),
    defaultValues: {
      name: assessment?.name ?? '',
      description: assessment?.description ?? '',
      status: assessment?.status ?? 'ready',
      test_date_start: toDateInputValue(assessment?.test_date_start),
      test_date_end: toDateInputValue(assessment?.test_date_end),
      project_id: defaultProjectId ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      {projects && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id">Project</Label>
          <Controller
            name="project_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
            )}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Mobile App Q1 Audit" />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Brief description of this assessment"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="test_date_start">Start Date</Label>
          <Input id="test_date_start" type="date" {...register('test_date_start')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="test_date_end">End Date</Label>
          <Input id="test_date_end" type="date" {...register('test_date_end')} />
          {errors.test_date_end && (
            <p role="alert" className="text-sm text-destructive">
              {errors.test_date_end.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Save Assessment'}
        </Button>
        {cancelHref && (
          <Button asChild variant="outline" size="sm">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
