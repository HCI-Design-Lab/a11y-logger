'use client';

import { Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

interface GenerateAllConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criteriaCount: number;
  onConfirm: () => void;
}

export function GenerateAllConfirmDialog({
  open,
  onOpenChange,
  criteriaCount,
  onConfirm,
}: GenerateAllConfirmDialogProps) {
  const t = useTranslations('vpats.generate_all');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description', { criteriaCount })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <X className="h-4 w-4" />
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction variant="ai" onClick={onConfirm}>
            <Sparkles className="h-4 w-4" />
            {t('generate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
