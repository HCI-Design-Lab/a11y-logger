'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface StatusTransitionButtonProps {
  projectId: string;
  assessmentId: string;
  currentStatus: 'planning' | 'in_progress' | 'completed';
}

const nextStatus: Record<string, { status: string; label: string } | null> = {
  planning: { status: 'in_progress', label: 'Mark as In Progress' },
  in_progress: { status: 'completed', label: 'Mark as Complete' },
  completed: null,
};

export function StatusTransitionButton({
  projectId,
  assessmentId,
  currentStatus,
}: StatusTransitionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const transition = nextStatus[currentStatus];

  if (!transition) return null;

  const handleTransition = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: transition.status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Assessment marked as ${transition.status.replace('_', ' ')}`);
      router.refresh();
    } catch {
      toast.error('Failed to update status');
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleTransition} disabled={loading}>
      {transition.label}
    </Button>
  );
}
