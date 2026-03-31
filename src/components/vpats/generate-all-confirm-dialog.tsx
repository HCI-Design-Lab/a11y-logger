'use client';

import { Sparkles, X } from 'lucide-react';
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate All Criteria?</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate remarks for {criteriaCount} criteria. This may take a few minutes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <X className="h-4 w-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction variant="ai" onClick={onConfirm}>
            <Sparkles className="h-4 w-4" />
            Generate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
