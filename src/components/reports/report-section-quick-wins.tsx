'use client';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  onDelete: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function QuickWinsSection({ items, onChange, onDelete, onGenerate, isGenerating }: Props) {
  const normalizedItems = Array.from({ length: 5 }, (_, i) => items[i] ?? '');

  const handleItemChange = (index: number, value: string) => {
    const updated = [...normalizedItems];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Quick Wins</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ai"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
          >
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
        <ol data-testid="section-fields" className="space-y-2" inert={isGenerating || undefined}>
          {normalizedItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-4 shrink-0">{index + 1}.</span>
              <Input
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Quick win ${index + 1}`}
              />
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
