'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

interface DeleteReportButtonProps {
  reportId: string;
  reportTitle: string;
}

export function DeleteReportButton({ reportId, reportTitle }: DeleteReportButtonProps) {
  const router = useRouter();
  const tDelete = useTranslations('reports.delete_dialog');
  const tToast = useTranslations('reports.toast');
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('delete_failed'));
        return;
      }
      toast.success(tToast('deleted'));
      router.push('/reports');
      router.refresh();
    } catch {
      toast.error(tToast('delete_failed'));
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          {tDelete('confirm_button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tDelete('title', { name: reportTitle })}</AlertDialogTitle>
          <AlertDialogDescription>{tDelete('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tDelete('cancel_button')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {tDelete('confirm_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
