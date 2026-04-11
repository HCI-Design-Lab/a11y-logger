'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginSchema, type LoginInput } from '@/lib/validators/users';

export function LoginForm() {
  const router = useRouter();
  const tLogin = useTranslations('auth.login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/dashboard');
      } else {
        setServerError(json.error ?? 'Login failed');
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-2xl font-semibold">{tLogin('heading')}</h2>
      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="username">{tLogin('username_label')}</Label>
        <Input
          id="username"
          type="text"
          {...register('username')}
          autoComplete="username"
          placeholder={tLogin('username_placeholder')}
        />
        {errors.username && (
          <p role="alert" className="text-sm text-destructive">
            {errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">{tLogin('password_label')}</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          autoComplete="current-password"
          placeholder={tLogin('password_placeholder')}
        />
        {errors.password && (
          <p role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? tLogin('submit_button_loading') : tLogin('submit_button')}
      </Button>
    </form>
  );
}
