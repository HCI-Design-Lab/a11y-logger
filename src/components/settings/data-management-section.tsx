'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DataManagementSectionProps {
  dbPath: string;
  mediaPath: string;
}

export function DataManagementSection({ dbPath, mediaPath }: DataManagementSectionProps) {
  const [resetConfirm, setResetConfirm] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Manage your local data storage, exports, and imports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="db-path">Database Path</Label>
            <Input id="db-path" value={dbPath} readOnly className="font-mono text-sm bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-path">Media Path</Label>
            <Input
              id="media-path"
              value={mediaPath}
              readOnly
              className="font-mono text-sm bg-muted"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            These paths are read-only. To change them, set the <code className="font-mono">DATABASE_PATH</code> environment variable before starting the server.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Export Data (coming soon)
          </Button>
          <Button variant="outline" disabled>
            Import Data (coming soon)
          </Button>
        </div>

        <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
          <h3 className="font-medium text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Reset the database. This will permanently delete all projects, assessments, issues,
            reports, and VPATs.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Reset Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Database?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL data. Type <strong>RESET</strong> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm">Type RESET to confirm</Label>
                <Input
                  id="reset-confirm"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="RESET"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetConfirm('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={resetConfirm !== 'RESET'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => toast.info('Database reset not yet implemented')}
                >
                  Reset Database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
