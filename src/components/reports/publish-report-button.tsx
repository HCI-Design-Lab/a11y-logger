'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, SendHorizonal } from 'lucide-react';
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

interface PublishReportButtonProps {
  reportId: string;
  isPublished: boolean;
}

export function PublishReportButton({ reportId, isPublished }: PublishReportButtonProps) {
  const router = useRouter();
  const tPublish = useTranslations('reports.publish_dialog');
  const tMenu = useTranslations('reports.settings_menu');
  const tToast = useTranslations('reports.toast');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('update_failed'));
        return;
      }
      toast.success(tToast('published'));
      router.refresh();
    } catch {
      toast.error(tToast('update_failed'));
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  }

  async function handleUnpublish() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('update_failed'));
        return;
      }
      toast.success(tToast('unpublished'));
      router.refresh();
    } catch {
      toast.error(tToast('update_failed'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isPublished) {
    return (
      <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={isLoading}>
        <SendHorizonal className="mr-2 h-4 w-4" />
        {tMenu('unpublish')}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" disabled={isLoading}>
          <Send className="mr-2 h-4 w-4" />
          {tPublish('confirm_button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tPublish('title')}</AlertDialogTitle>
          <AlertDialogDescription>{tPublish('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tPublish('cancel_button')}</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublish} disabled={isLoading}>
            {tPublish('confirm_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
