'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CreateProjectSchema } from '@/lib/validators/projects';
import type { CreateProjectInput } from '@/lib/validators/projects';
import type { Project } from '@/lib/db/projects';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: CreateProjectInput) => void;
  loading?: boolean;
  cancelHref?: string;
  deleteButton?: React.ReactNode;
  /** When set, the form renders with this id and hides its internal buttons so the caller can render them externally via the `form` attribute. */
  externalButtons?: string;
}

export function ProjectForm({
  project,
  onSubmit,
  loading,
  cancelHref,
  deleteButton,
  externalButtons,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      product_url: project?.product_url ?? '',
    },
  });

  return (
    <form id={externalButtons} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name *</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Mobile App Redesign" />
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
          rows={5}
          placeholder="Brief description of the project"
        />
        {errors.description && (
          <p role="alert" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product_url">Product URL</Label>
        <Input
          id="product_url"
          type="url"
          {...register('product_url')}
          placeholder="https://example.com"
        />
        {errors.product_url && (
          <p role="alert" className="text-sm text-destructive">
            {errors.product_url.message}
          </p>
        )}
      </div>
      {!externalButtons && (
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Saving…' : 'Save Project'}
          </Button>
          {cancelHref && (
            <Button asChild variant="outline">
              <Link href={cancelHref}>
                <X className="h-4 w-4" />
                Cancel
              </Link>
            </Button>
          )}
          {deleteButton && <div className="ml-auto">{deleteButton}</div>}
        </div>
      )}
    </form>
  );
}
