'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  externalButtons?: string;
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
  externalButtons,
}: AssessmentFormProps) {
  const t = useTranslations('assessments.form');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id={externalButtons}>
      {projects && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id">{t('project_label')}</Label>
          <Controller
            name="project_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="project_id">
                  <SelectValue placeholder={t('project_placeholder')} />
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
        <Label htmlFor="name">
          {t('name_label')} <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register('name')} placeholder={t('name_placeholder')} />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t('description_label')}</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder={t('description_placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="test_date_start">{t('start_date_label')}</Label>
          <Input id="test_date_start" type="date" {...register('test_date_start')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="test_date_end">{t('end_date_label')}</Label>
          <Input id="test_date_end" type="date" {...register('test_date_end')} />
          {errors.test_date_end && (
            <p role="alert" className="text-sm text-destructive">
              {errors.test_date_end.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">{t('status_label')}</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">{t('status_options.ready')}</SelectItem>
                <SelectItem value="in_progress">{t('status_options.in_progress')}</SelectItem>
                <SelectItem value="completed">{t('status_options.completed')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {!externalButtons && (
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>
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
    </form>
  );
}
