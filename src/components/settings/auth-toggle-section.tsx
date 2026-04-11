'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthToggleSectionProps {
  authEnabled: boolean;
  hasUsers: boolean;
}

export function AuthToggleSection({
  authEnabled: initialEnabled,
  hasUsers,
}: AuthToggleSectionProps) {
  const t = useTranslations('settings.auth');
  const tToast = useTranslations('settings.toast');
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
        toast.success(tToast('auth_saved'));
      } else {
        toast.error(tToast('auth_save_failed'));
      }
    } catch {
      toast.error(tToast('auth_save_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('heading')}</CardTitle>
        <CardDescription>
          When enabled, users must log in to access the app. Requires at least one user account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('enable_label')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('enable_description')}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              variant={enabled ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={loading || !hasUsers}
              aria-pressed={enabled}
            >
              {loading ? t('updating_label') : enabled ? t('disable_button') : t('enable_button')}
            </Button>
            {!hasUsers && <p className="text-xs text-muted-foreground">Create an account first.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
