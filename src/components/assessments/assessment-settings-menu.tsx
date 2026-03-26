'use client';

import Link from 'next/link';
import { Settings, Plus, Upload, Pencil, CirclePlay, CircleCheck, Ban } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportIssuesModal } from '@/components/issues/import-issues-modal';

interface AssessmentSettingsMenuProps {
  projectId: string;
  assessmentId: string;
  currentStatus?: 'ready' | 'in_progress' | 'completed';
}

const statusTransition = {
  ready: { next: 'in_progress', label: 'Mark as In Progress', Icon: CirclePlay },
  in_progress: { next: 'completed', label: 'Mark as Complete', Icon: CircleCheck },
  completed: { next: 'in_progress', label: 'Mark as Incomplete', Icon: Ban },
} as const;

export function AssessmentSettingsMenu({
  projectId,
  assessmentId,
  currentStatus,
}: AssessmentSettingsMenuProps) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}`;

  async function handleStatusTransition() {
    if (!currentStatus) return;
    const { next } = statusTransition[currentStatus];
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status updated');
        router.refresh();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  }

  const transition = currentStatus ? statusTransition[currentStatus] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Assessment settings">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {transition && (
            <>
              <DropdownMenuItem onSelect={handleStatusTransition} disabled={loading}>
                <transition.Icon className="mr-2 h-4 w-4" />
                {transition.label}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/issues/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Issue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Issues
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Assessment
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportIssuesModal
        projectId={projectId}
        assessmentId={assessmentId}
        onImportComplete={() => router.refresh()}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </>
  );
}
