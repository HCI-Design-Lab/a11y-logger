'use client';

import Link from 'next/link';
import { Settings, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface IssueSettingsMenuProps {
  projectId: string;
  assessmentId: string;
  issueId: string;
  issueTitle: string;
}

export function IssueSettingsMenu({
  projectId,
  assessmentId,
  issueId,
  issueTitle,
}: IssueSettingsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`;

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Issue deleted');
      router.push(`/projects/${projectId}/assessments/${assessmentId}`);
    } catch {
      toast.error('Failed to delete issue');
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Issue settings" className="bg-card">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Issue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {issueTitle}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the issue and all associated data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4" />
              Delete Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
