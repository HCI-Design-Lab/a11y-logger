'use client';
import { Sparkles, Trash2 } from 'lucide-react';
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
        <ol className="space-y-2">
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
