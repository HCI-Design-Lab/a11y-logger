'use client';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface Props {
  body: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ExecutiveSummarySection({
  body,
  onChange,
  onDelete,
  onGenerate,
  isGenerating,
}: Props) {
  const t = useTranslations('reports.sections');
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('executive_summary_title')}</CardTitle>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ai" size="sm" onClick={onGenerate} disabled={isGenerating}>
            <Sparkles />
            {isGenerating ? 'Generating…' : 'Generate'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isGenerating}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isGenerating && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm rounded-b-lg"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generating with AI...</p>
          </div>
        )}
        <div data-testid="section-fields" inert={isGenerating || undefined}>
          <RichTextEditor
            value={body}
            onChange={onChange}
            placeholder="Write your executive summary…"
          />
        </div>
      </CardContent>
    </Card>
  );
}
