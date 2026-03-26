'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteIssueButtonProps {
  projectId: string;
  assessmentId: string;
  issueId: string;
  issueTitle: string;
}

export function DeleteIssueButton({
  projectId,
  assessmentId,
  issueId,
  issueTitle,
}: DeleteIssueButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
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
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={loading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {issueTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the issue and all associated data. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Issue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
