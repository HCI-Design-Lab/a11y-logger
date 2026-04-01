'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

interface UserManagementSectionProps {
  users: User[];
}

function CreateAccountForm({ onCreated }: { onCreated: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'admin' }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Failed to create account.');
        return;
      }
      toast.success('Account created');
      onCreated(json.data);
    } catch {
      setError('Failed to create account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium">Create Account</h3>
      <div className="space-y-1.5">
        <Label htmlFor="new-username">Username</Label>
        <Input
          id="new-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create Account'}
      </Button>
    </form>
  );
}

function ChangePasswordForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Failed to update password.');
        return;
      }
      toast.success('Password updated');
      onDone();
    } catch {
      setError('Failed to update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="change-password">New Password</Label>
        <Input
          id="change-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="change-confirm-password">Confirm Password</Label>
        <Input
          id="change-confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Password'}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function UserManagementSection({ users: initialUsers }: UserManagementSectionProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [changingPassword, setChangingPassword] = useState(false);

  const currentUser = users[0] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Account</CardTitle>
        <CardDescription>
          {currentUser
            ? 'Manage your local account credentials.'
            : 'Create an account to enable authentication.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!currentUser ? (
          <CreateAccountForm onCreated={(user) => setUsers([user])} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentUser.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
              </div>
              {!changingPassword && (
                <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                  Change Password
                </Button>
              )}
            </div>
            {changingPassword && (
              <ChangePasswordForm user={currentUser} onDone={() => setChangingPassword(false)} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
