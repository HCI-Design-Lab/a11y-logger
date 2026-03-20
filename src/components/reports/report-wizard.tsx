'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Remove assessments that belonged to this project
        const projectAssessmentIds = new Set(
          assessments.filter((a) => a.project_id === id).map((a) => a.id)
        );
        setSelectedAssessments((prevA) => {
          const nextA = new Set(prevA);
          for (const aid of projectAssessmentIds) {
            nextA.delete(aid);
          }
          return nextA;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAssessment = (id: string) => {
    setSelectedAssessments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
              <div className="grid gap-2">
                {projects.map((p) => (
                  <SelectableCard
                    key={p.id}
                    label={p.name}
                    selected={selectedProjects.has(p.id)}
                    onToggle={() => toggleProject(p.id)}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={selectedProjects.size === 0}>
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-2">
                {visibleAssessments.map((a) => (
                  <SelectableCard
                    key={a.id}
                    label={a.name}
                    selected={selectedAssessments.has(a.id)}
                    onToggle={() => toggleAssessment(a.id)}
                  />
                ))}
                {visibleAssessments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No assessments found for selected projects.
                  </p>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={selectedAssessments.size === 0}>
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
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !title.trim()}>
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
            className={cn('flex items-center gap-1', current >= n && 'text-foreground font-medium')}
          >
            {current > n ? <Check className="h-3 w-3" /> : null}
            Step {n}
          </span>
        </span>
      ))}
    </div>
  );
}

function SelectableCard({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left rounded-lg border p-3 text-sm transition-colors',
        selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
      )}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>
    </button>
  );
}
