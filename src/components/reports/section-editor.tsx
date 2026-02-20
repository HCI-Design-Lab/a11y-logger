'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

/** Shape used by the editor UI (content field maps to body in the DB/API) */
export interface EditorSection {
  title: string;
  content: string;
}

interface SectionEditorProps {
  sections: EditorSection[];
  onChange: (sections: EditorSection[]) => void;
}

export function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const addSection = () => onChange([...sections, { title: '', content: '' }]);

  const removeSection = (index: number) => onChange(sections.filter((_, i) => i !== index));

  const updateSection = (index: number, field: keyof EditorSection, value: string) => {
    const updated = sections.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={`section-${index}`} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`section-title-${index}`}>Section Title</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSection(index)}
              aria-label="Remove section"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            id={`section-title-${index}`}
            value={section.title}
            onChange={(e) => updateSection(index, 'title', e.target.value)}
            placeholder="Section title"
          />
          <Textarea
            value={section.content}
            onChange={(e) => updateSection(index, 'content', e.target.value)}
            placeholder="Section content (markdown supported)"
            rows={6}
          />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addSection}>
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
