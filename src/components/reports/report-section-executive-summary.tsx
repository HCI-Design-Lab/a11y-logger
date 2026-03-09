'use client';
import { Sparkles, Trash2 } from 'lucide-react';
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Executive Summary</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onGenerate}
            disabled={isGenerating}
            aria-label="Generate with AI"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RichTextEditor
          value={body}
          onChange={onChange}
          placeholder="Write your executive summary…"
        />
      </CardContent>
    </Card>
  );
}
