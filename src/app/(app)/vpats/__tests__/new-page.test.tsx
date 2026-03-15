import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import NewVpatPage from '../new/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('NewVpatPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [{ id: 'p1', name: 'Project Alpha' }] }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows WCAG version options on first step', async () => {
    render(<NewVpatPage />);
    expect(screen.getByText(/wcag version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wcag 2\.1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wcag 2\.2/i)).toBeInTheDocument();
  });

  it('shows conformance level options on first step', async () => {
    render(<NewVpatPage />);
    expect(screen.getByLabelText(/level a only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/level a \+ aa$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/level a \+ aa \+ aaa/i)).toBeInTheDocument();
  });

  it('advances to details step when Next is clicked', async () => {
    render(<NewVpatPage />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByLabelText(/title/i)).toBeInTheDocument();
  });

  it('can go back from details step to scope step', async () => {
    render(<NewVpatPage />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByLabelText(/title/i);
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(await screen.findByText(/wcag version/i)).toBeInTheDocument();
  });

  it('shows project dropdown on details step', async () => {
    render(<NewVpatPage />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText(/project alpha/i)).toBeInTheDocument();
  });
});
