'use client';

import Link from 'next/link';
import { Settings, Pencil, Plus, Trash2 } from 'lucide-react';
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

interface ProjectSettingsMenuProps {
  projectId: string;
  projectName: string;
}

export function ProjectSettingsMenu({ projectId, projectName }: ProjectSettingsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to delete project');
        return;
      }
      toast.success('Project deleted');
      router.push('/projects');
      router.refresh();
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Project settings" className="bg-card">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/projects/${projectId}/assessments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/projects/${projectId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {projectName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its assessments, issues, reports, and
              VPATs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
