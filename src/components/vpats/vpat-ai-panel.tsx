'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from '@/components/issues/severity-badge';
import type { Issue } from '@/lib/db/issues';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};

const SUGGESTED_CONFORMANCE_COLORS: Record<string, string> = {
  supports: 'bg-green-100 border-green-500 text-green-700',
  does_not_support: 'bg-red-100 border-red-500 text-red-700',
  not_applicable: 'bg-gray-100 border-gray-400 text-gray-600',
};

const SUGGESTED_CONFORMANCE_LABELS: Record<string, string> = {
  supports: 'Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
};

interface VpatAiPanelProps {
  row: VpatCriterionRow;
  onClose: () => void;
}

export function VpatAiPanel({ row, onClose }: VpatAiPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-xl z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`AI Analysis for criterion ${row.criterion_code}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold">AI Analysis — {row.criterion_code}</h2>
          <p className="text-sm text-muted-foreground">{row.criterion_name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          ref={closeButtonRef}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {row.ai_confidence && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence</span>
            <Badge
              variant="outline"
              className={`text-xs ${CONFIDENCE_COLORS[row.ai_confidence] ?? ''}`}
            >
              {row.ai_confidence}
            </Badge>
            {row.ai_confidence === 'low' && (
              <span className="text-xs text-amber-600">
                Limited evidence — consider additional testing.
              </span>
            )}
          </div>
        )}

        {row.ai_suggested_conformance && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Suggested Conformance</span>
            <Badge
              variant="outline"
              className={`text-xs ${SUGGESTED_CONFORMANCE_COLORS[row.ai_suggested_conformance] ?? ''}`}
            >
              {SUGGESTED_CONFORMANCE_LABELS[row.ai_suggested_conformance]}
            </Badge>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">
            Issues Referenced
            {row.ai_referenced_issues && row.ai_referenced_issues.length > 0 && (
              <span className="font-normal text-muted-foreground ml-1">
                ({row.ai_referenced_issues.length})
              </span>
            )}
          </p>
          {row.ai_referenced_issues && row.ai_referenced_issues.length > 0 ? (
            <ul className="space-y-2">
              {row.ai_referenced_issues.map((issue, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {issue.id && issue.assessment_id && issue.project_id ? (
                    <a
                      href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex-1"
                    >
                      {issue.title}
                    </a>
                  ) : (
                    <span className="text-muted-foreground flex-1">{issue.title}</span>
                  )}
                  <SeverityBadge severity={issue.severity as Issue['severity']} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No issues referenced.</p>
          )}
        </div>

        {row.ai_reasoning && (
          <div>
            <p className="text-sm font-medium mb-1">Reasoning</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.ai_reasoning}</p>
          </div>
        )}

        {row.last_generated_at && (
          <p className="text-xs text-muted-foreground border-t pt-2">
            Generated{' '}
            {new Date(row.last_generated_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
