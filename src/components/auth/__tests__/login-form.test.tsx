import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { LoginForm } from '@/components/auth/login-form';
import messages from '@/messages/en.json';

const mockPush = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

test('renders heading Sign In', () => {
  renderWithIntl(<LoginForm />);
  expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
});

test('renders username and password fields', () => {
  renderWithIntl(<LoginForm />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('renders submit button with Sign In text', () => {
  renderWithIntl(<LoginForm />);
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
});

test('shows error on failed login', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ success: false, error: 'Invalid credentials' }),
  } as Response);
  renderWithIntl(<LoginForm />);
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
  renderWithIntl(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
});

test('shows error when username is empty on submit', async () => {
  renderWithIntl(<LoginForm />);
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() =>
    expect(
      screen.getAllByRole('alert').some((el) => el.textContent?.toLowerCase().includes('username'))
    ).toBe(true)
  );
});

test('shows error when password is empty on submit', async () => {
  renderWithIntl(<LoginForm />);
  await userEvent.type(screen.getByLabelText(/username/i), 'admin');
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() =>
    expect(
      screen.getAllByRole('alert').some((el) => el.textContent?.toLowerCase().includes('password'))
    ).toBe(true)
  );
});
