import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NewVpatPage from '../new/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
// Mock fetch for projects list
vi.mock('global', () => ({}));

describe('NewVpatPage', () => {
  it('shows step 1 edition selection on mount', () => {
    render(<NewVpatPage />);
    expect(screen.getByText(/Select Edition/i)).toBeInTheDocument();
    expect(screen.getByText('WCAG')).toBeInTheDocument();
    expect(screen.getByText('Section 508')).toBeInTheDocument();
    expect(screen.getByText(/EN 301 549/)).toBeInTheDocument();
    expect(screen.getByText(/International/i)).toBeInTheDocument();
  });

  it('advances to step 2 after selecting an edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Product Scope/i)).toBeInTheDocument();
  });

  it('shows WCAG version selector on step 2 for WCAG edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/WCAG Version/i)).toBeInTheDocument();
  });

  it('hides WCAG version selector for 508 edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('Section 508'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.queryByLabelText(/WCAG Version/i)).not.toBeInTheDocument();
  });

  it('shows step 3 details after scope is configured', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });
});
