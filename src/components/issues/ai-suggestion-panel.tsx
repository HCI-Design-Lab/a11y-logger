'use client';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AiSuggestionPanelProps {
  aiDescription: string;
  onDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  aiLoading: boolean;
  aiError: string | null;
}

export function AiSuggestionPanel({
  aiDescription,
  onDescriptionChange,
  onGenerate,
  aiLoading,
  aiError,
}: AiSuggestionPanelProps) {
  return (
    <div className="rounded-md border border-ai p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        You can enter a description here and press <strong>Generate with AI</strong> to have the
        rest of the issue filled out by the AI. For best results, include:
      </p>
      <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
        <li>
          <strong>Component:</strong> What element is affected? (e.g. &ldquo;Search button&rdquo;)
        </li>
        <li>
          <strong>Location:</strong> Where does the issue occur? (e.g. &ldquo;Homepage&rdquo;)
        </li>
        <li>
          <strong>What&rsquo;s Happening:</strong> What is wrong? (e.g. &ldquo;Not focusable via
          keyboard&rdquo;)
        </li>
        <li>
          <strong>Expected Behavior (Optional):</strong> What is the expected behavior?
        </li>
      </ol>
      <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          AI assistance will only fill in fields you&rsquo;ve left empty; it will not overwrite
          values you&rsquo;ve already entered.
        </span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ai_description">AI Assistance Description</Label>
        <Textarea
          id="ai_description"
          value={aiDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          disabled={aiLoading}
          placeholder="Example: The search button on the homepage is not operable via keyboard. It should be focusable and activated using the Enter key."
        />
      </div>

      {aiError && <p className="text-sm text-destructive">{aiError}</p>}

      <Button
        type="button"
        variant="ai"
        size="sm"
        onClick={onGenerate}
        disabled={aiLoading || !aiDescription.trim()}
      >
        <Sparkles className="mr-1 h-4 w-4" />
        {aiLoading ? 'Generating…' : 'Generate with AI'}
      </Button>
    </div>
  );
}
