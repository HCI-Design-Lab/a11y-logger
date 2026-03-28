'use client';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ReportContent } from '@/lib/validators/reports';

type UserImpact = NonNullable<ReportContent['user_impact']>;

interface Props {
  data: UserImpact;
  onChange: (data: UserImpact) => void;
  onDelete: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const IMPACT_FIELDS: { key: keyof UserImpact; label: string }[] = [
  { key: 'screen_reader', label: 'Screen Reader User' },
  { key: 'low_vision', label: 'Low Vision' },
  { key: 'color_vision', label: 'Color Vision' },
  { key: 'keyboard_only', label: 'Keyboard Only' },
  { key: 'cognitive', label: 'Cognitive' },
  { key: 'deaf_hard_of_hearing', label: 'Deaf / Hard of Hearing' },
];

export function UserImpactSection({ data, onChange, onDelete, onGenerate, isGenerating }: Props) {
  const handleFieldChange = (key: keyof UserImpact, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>User Impact</CardTitle>
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
        <div
          data-testid="section-fields"
          className="grid grid-cols-2 gap-4"
          inert={isGenerating || undefined}
        >
          {IMPACT_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`user-impact-${key}`}>{label}</Label>
              <Textarea
                id={`user-impact-${key}`}
                value={data[key]}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={label}
                rows={10}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
