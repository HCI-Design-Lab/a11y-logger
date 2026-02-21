'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Project } from '@/lib/db/projects';

interface ProjectFormData {
  name: string;
  description: string;
  product_url: string;
}

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  loading?: boolean;
}

export function ProjectForm({ project, onSubmit, loading }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [productUrl, setProductUrl] = useState(project?.product_url ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, product_url: productUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Mobile App Redesign"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the project"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product_url">Product URL</Label>
        <Input
          id="product_url"
          type="url"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save Project'}
      </Button>
    </form>
  );
}
