'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExecutiveSummarySection } from './report-section-executive-summary';
import { TopRisksSection } from './report-section-top-risks';
import { QuickWinsSection } from './report-section-quick-wins';
import { UserImpactSection } from './report-section-user-impact';
import { ReportSectionDeleteModal } from './report-section-delete-modal';
import { ReportIssuesPanel } from './report-issues-panel';
import type { Report } from '@/lib/db/reports';
import type { IssueWithContext } from '@/lib/db/issues';
import type { ReportContent } from '@/lib/validators/reports';

type SectionKey = keyof ReportContent;

const SECTION_LABELS: Record<SectionKey, string> = {
  executive_summary: 'Executive Summary',
  top_risks: 'Top Risks',
  quick_wins: 'Quick Wins',
  user_impact: 'User Impact',
};

const EMPTY_USER_IMPACT = {
  screen_reader: '',
  low_vision: '',
  color_vision: '',
  keyboard_only: '',
  cognitive: '',
  deaf_hard_of_hearing: '',
};

interface Props {
  report: Report;
  issues: IssueWithContext[];
}

export function ReportEditForm({ report, issues }: Props) {
  const router = useRouter();
  const [content, setContent] = useState<ReportContent>(() => {
    try {
      return JSON.parse(report.content) as ReportContent;
    } catch {
      return {};
    }
  });
  const [deleteTarget, setDeleteTarget] = useState<SectionKey | null>(null);
  const [generating, setGenerating] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const hasSection = (key: SectionKey) => key in content;

  const addSection = (key: SectionKey) => {
    setContent((prev) => {
      if (key === 'executive_summary') return { ...prev, executive_summary: { body: '' } };
      if (key === 'top_risks') return { ...prev, top_risks: { items: [] } };
      if (key === 'quick_wins') return { ...prev, quick_wins: { items: [] } };
      if (key === 'user_impact') return { ...prev, user_impact: { ...EMPTY_USER_IMPACT } };
      return prev;
    });
  };

  const removeSection = (key: SectionKey) => {
    setContent((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDeleteTarget(null);
  };

  const generateSection = async (key: SectionKey) => {
    setGenerating((prev) => ({ ...prev, [key]: true }));
    const endpointMap: Record<SectionKey, string> = {
      executive_summary: '/api/ai/report/executive-summary',
      top_risks: '/api/ai/report/top-risks',
      quick_wins: '/api/ai/report/quick-wins',
      user_impact: '/api/ai/report/user-impact',
    };
    try {
      const res = await fetch(endpointMap[key], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'AI generation failed');
        return;
      }
      setContent((prev) => {
        if (key === 'executive_summary')
          return { ...prev, executive_summary: { body: json.data.body } };
        if (key === 'top_risks') return { ...prev, top_risks: { items: json.data.items } };
        if (key === 'quick_wins') return { ...prev, quick_wins: { items: json.data.items } };
        if (key === 'user_impact') return { ...prev, user_impact: json.data };
        return prev;
      });
    } catch {
      toast.error('Failed to connect to AI service');
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to save');
        return;
      }
      toast.success('Report saved');
      router.push(`/reports/${report.id}`);
    } catch {
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left: sections */}
      <div className="space-y-4">
        {/* Executive Summary — full width */}
        {!hasSection('executive_summary') ? (
          <PlaceholderCard
            label="Add Executive Summary"
            onAdd={() => addSection('executive_summary')}
          />
        ) : (
          <ExecutiveSummarySection
            body={content.executive_summary?.body ?? ''}
            onChange={(val) => setContent((p) => ({ ...p, executive_summary: { body: val } }))}
            onDelete={() => setDeleteTarget('executive_summary')}
            onGenerate={() => generateSection('executive_summary')}
            isGenerating={!!generating.executive_summary}
          />
        )}

        {/* Top Risks + Quick Wins — side by side */}
        <div className="grid grid-cols-2 gap-4">
          {!hasSection('top_risks') ? (
            <PlaceholderCard label="Add Top Risks" onAdd={() => addSection('top_risks')} />
          ) : (
            <TopRisksSection
              items={content.top_risks?.items ?? []}
              onChange={(items) => setContent((p) => ({ ...p, top_risks: { items } }))}
              onDelete={() => setDeleteTarget('top_risks')}
              onGenerate={() => generateSection('top_risks')}
              isGenerating={!!generating.top_risks}
            />
          )}
          {!hasSection('quick_wins') ? (
            <PlaceholderCard label="Add Quick Wins" onAdd={() => addSection('quick_wins')} />
          ) : (
            <QuickWinsSection
              items={content.quick_wins?.items ?? []}
              onChange={(items) => setContent((p) => ({ ...p, quick_wins: { items } }))}
              onDelete={() => setDeleteTarget('quick_wins')}
              onGenerate={() => generateSection('quick_wins')}
              isGenerating={!!generating.quick_wins}
            />
          )}
        </div>

        {/* User Impact — full width */}
        {!hasSection('user_impact') ? (
          <PlaceholderCard label="Add User Impact" onAdd={() => addSection('user_impact')} />
        ) : (
          <UserImpactSection
            data={content.user_impact ?? { ...EMPTY_USER_IMPACT }}
            onChange={(data) => setContent((p) => ({ ...p, user_impact: data }))}
            onDelete={() => setDeleteTarget('user_impact')}
            onGenerate={() => generateSection('user_impact')}
            isGenerating={!!generating.user_impact}
          />
        )}

        <div className="pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Report'}
          </Button>
        </div>
      </div>

      {/* Right: issues panel */}
      <aside>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportIssuesPanel issues={issues} />
          </CardContent>
        </Card>
      </aside>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ReportSectionDeleteModal
          sectionName={SECTION_LABELS[deleteTarget]}
          onConfirm={() => removeSection(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function PlaceholderCard({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full rounded-lg border border-dashed p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      {label}
      <Plus className="h-4 w-4" />
    </button>
  );
}
