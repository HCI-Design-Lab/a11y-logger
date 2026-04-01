import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from '@/components/auth/login-form';

const mockPush = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

test('renders username and password fields', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('shows error on failed login', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ success: false, error: 'Invalid credentials' }),
  } as Response);
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'baduser' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i));
});

test('redirects to dashboard on successful login', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({ success: true, data: { id: '1', username: 'testuser', role: 'admin' } }),
  } as Response);
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
});

test('shows error when username is empty on submit', async () => {
  render(<LoginForm />);
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() =>
    expect(
      screen.getAllByRole('alert').some((el) => el.textContent?.toLowerCase().includes('username'))
    ).toBe(true)
  );
});

test('shows error when password is empty on submit', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText(/username/i), 'admin');
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() =>
    expect(
      screen.getAllByRole('alert').some((el) => el.textContent?.toLowerCase().includes('password'))
    ).toBe(true)
  );
});
