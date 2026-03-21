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

export function TopRisksSection({ items, onChange, onDelete, onGenerate, isGenerating }: Props) {
  const normalizedItems = Array.from({ length: 5 }, (_, i) => items[i] ?? '');

  const handleItemChange = (index: number, value: string) => {
    const updated = [...normalizedItems];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Top Risks</CardTitle>
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
            disabled={isGenerating}
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
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
                placeholder={`Risk ${index + 1}`}
              />
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
