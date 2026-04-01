'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthToggleSectionProps {
  authEnabled: boolean;
  hasUsers: boolean;
}

export function AuthToggleSection({ authEnabled: initialEnabled, hasUsers }: AuthToggleSectionProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(data.data.enabled);
        toast.success(
          data.data.enabled
            ? 'Authentication enabled. Users must log in.'
            : 'Authentication disabled. App is open access.'
        );
      } else {
        toast.error('Failed to update authentication setting');
      }
    } catch {
      toast.error('Failed to update authentication setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>
          When enabled, users must log in to access the app. Requires at least one user account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Authentication is currently{' '}
              <span className={enabled ? 'text-green-600' : 'text-muted-foreground'}>
                {enabled ? 'enabled' : 'disabled'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? 'Users must provide credentials to access the app.'
                : 'App is open access — no login required.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              variant={enabled ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={loading || !hasUsers}
              aria-pressed={enabled}
            >
              {loading ? 'Updating…' : enabled ? 'Disable Auth' : 'Enable Auth'}
            </Button>
            {!hasUsers && (
              <p className="text-xs text-muted-foreground">Create an account first.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
