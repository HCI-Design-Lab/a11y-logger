'use client';
import { useState } from 'react';
import { VpatCriteriaTable, type CriterionRow } from './vpat-criteria-table';
import { VpatIssuesPanel } from './vpat-issues-panel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface IssueItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string | null;
  project_id: string;
  assessment_id: string;
}

interface Props {
  criteria: CriterionRow[];
  projectId?: string;
  readOnly?: boolean;
  onChange?: (criteria: CriterionRow[]) => void;
  onGenerateAll?: () => void;
}

export function VpatCriteriaWithPanel({
  criteria,
  projectId,
  readOnly,
  onChange,
  onGenerateAll,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [panelIssues, setPanelIssues] = useState<IssueItem[]>([]);

  const handleIssuesBadgeClick = async (criterionCode: string) => {
    const row = criteria.find((r) => r.criterion_code === criterionCode);
    if (!row || row.related_issue_ids.length === 0) return;

    setSelectedCode(criterionCode);
    setPanelIssues([]);
    setPanelOpen(true);

    try {
      const ids = row.related_issue_ids.join(',');
      const res = await fetch(`/api/issues/by-ids?ids=${ids}`);
      const json = await res.json();
      if (json.success) setPanelIssues(json.data);
    } catch {
      // silently fail — panel shows empty state
    }
  };

  return (
    <>
      <VpatCriteriaTable
        criteria={criteria}
        onChange={onChange}
        readOnly={readOnly}
        projectId={projectId}
        onIssuesBadgeClick={handleIssuesBadgeClick}
        onGenerateAll={onGenerateAll}
      />
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Linked Issues</SheetTitle>
          </SheetHeader>
          {selectedCode && (
            <div className="mt-4">
              <VpatIssuesPanel issues={panelIssues} criterionCode={selectedCode} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
