'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Settings, Send, Download, Trash2, Pencil } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface VpatSettingsMenuProps {
  vpatId: string;
  vpatTitle: string;
  isPublished: boolean;
  canPublish: boolean;
  isPublishing: boolean;
  onPublish: () => void;
  onEdit?: () => void;
  variant?: 'view' | 'edit';
}

export function VpatSettingsMenu({
  vpatId,
  vpatTitle,
  isPublished,
  canPublish,
  isPublishing,
  onPublish,
  onEdit,
  variant,
}: VpatSettingsMenuProps) {
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to delete VPAT');
        return;
      }
      toast.success('VPAT deleted');
      router.push('/vpats');
      router.refresh();
    } catch {
      toast.error('Failed to delete VPAT');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="VPAT settings">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {variant === 'view' && (
            <>
              <DropdownMenuItem
                asChild={!isPublished}
                onSelect={isPublished ? () => setEditOpen(true) : undefined}
              >
                {isPublished ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit VPAT
                  </>
                ) : (
                  <Link href={`/vpats/${vpatId}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit VPAT
                  </Link>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {!isPublished && (variant !== 'view' || canPublish) && (
            <>
              <DropdownMenuItem
                onSelect={() => setPublishOpen(true)}
                disabled={!canPublish || isPublishing}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <a
              href={`/api/vpats/${vpatId}/export?format=html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              HTML
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/vpats/${vpatId}/export?format=docx`}>
              <Download className="mr-2 h-4 w-4" />
              Word (.docx)
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/vpats/${vpatId}/export?format=openacr`}>
              <Download className="mr-2 h-4 w-4" />
              OpenACR (YAML)
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className=""
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Publish confirmation */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish VPAT</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing creates a snapshot of the current state. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'success' })}
              onClick={() => {
                setPublishOpen(false);
                onPublish();
              }}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit published confirmation */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Published VPAT?</AlertDialogTitle>
            <AlertDialogDescription>
              Editing will reset this VPAT to Draft. The current published version will be
              preserved and can be found in Version History.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditOpen(false);
                onEdit?.();
              }}
            >
              Edit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete VPAT</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{vpatTitle}&rdquo;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
