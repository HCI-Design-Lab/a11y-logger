'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

interface DeleteAssessmentButtonProps {
  projectId: string;
  assessmentId: string;
  assessmentName: string;
}

export function DeleteAssessmentButton({
  projectId,
  assessmentId,
  assessmentName,
}: DeleteAssessmentButtonProps) {
  const router = useRouter();
  const tDialog = useTranslations('assessments.delete_dialog');
  const tToast = useTranslations('assessments.toast');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(tToast('deleted'));
      router.push(`/projects/${projectId}`);
    } catch {
      toast.error(tToast('delete_failed'));
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={loading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {assessmentName}?</AlertDialogTitle>
          <AlertDialogDescription>{tDialog('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <X className="h-4 w-4" />
            {tDialog('cancel_button')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
            {tDialog('confirm_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
