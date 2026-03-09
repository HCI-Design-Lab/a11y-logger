'use client';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">User Impact</h3>
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        {IMPACT_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={`user-impact-${key}`}>{label}</Label>
            <Textarea
              id={`user-impact-${key}`}
              value={data[key]}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              placeholder={label}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
