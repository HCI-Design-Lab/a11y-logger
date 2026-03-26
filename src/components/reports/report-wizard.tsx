'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';

interface Project {
  id: string;
  name: string;
}
interface Assessment {
  id: string;
  project_id: string;
  name: string;
  status: string;
}

interface Props {
  projects: Project[];
  assessments: Assessment[];
}

export function ReportWizard({ projects, assessments }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const visibleAssessments = assessments.filter((a) => selectedProjects.has(a.project_id));

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, assessment_ids: Array.from(selectedAssessments) }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to create report');
        return;
      }
      router.push(`/reports/${json.data.id}/edit`);
      router.refresh();
    } catch {
      toast.error('Failed to create report');
    } finally {
      setIsCreating(false);
    }
  };

  const stepTitle =
    step === 1 ? 'Select Projects' : step === 2 ? 'Select Assessments' : 'Name Your Report';

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <StepIndicator current={step} />
          <CardTitle className="text-lg">{stepTitle}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Projects</Label>
                <MultiSelect
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  selected={Array.from(selectedProjects)}
                  onChange={(values) => {
                    // Remove assessments for deselected projects
                    const removed = Array.from(selectedProjects).filter(
                      (id) => !values.includes(id)
                    );
                    if (removed.length > 0) {
                      const removedAssessmentIds = new Set(
                        assessments.filter((a) => removed.includes(a.project_id)).map((a) => a.id)
                      );
                      setSelectedAssessments((prev) => {
                        const next = new Set(prev);
                        for (const id of removedAssessmentIds) next.delete(id);
                        return next;
                      });
                    }
                    setSelectedProjects(new Set(values));
                  }}
                  placeholder="Select projects…"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setStep(2)} disabled={selectedProjects.size === 0}>
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Assessments</Label>
                <MultiSelect
                  options={visibleAssessments.map((a) => ({ value: a.id, label: a.name }))}
                  selected={Array.from(selectedAssessments)}
                  onChange={(values) => setSelectedAssessments(new Set(values))}
                  placeholder={
                    visibleAssessments.length === 0
                      ? 'No assessments for selected projects'
                      : 'Select assessments…'
                  }
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={selectedAssessments.size === 0}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Report title"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={isCreating || !title.trim()}>
                  {isCreating ? 'Creating…' : 'Create Report'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {[1, 2, 3].map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground/40">—</span>}
          <span
            className={
              current >= n
                ? 'text-foreground font-medium flex items-center gap-1'
                : 'flex items-center gap-1'
            }
          >
            Step {n}
          </span>
        </span>
      ))}
    </div>
  );
}
