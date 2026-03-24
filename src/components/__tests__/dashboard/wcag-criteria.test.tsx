import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';

const mockCriteriaData = [
  { code: '1.1.1', name: 'Non-text Content', count: 12 },
  { code: '1.4.3', name: 'Contrast (Minimum)', count: 5 },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WcagCriteria', () => {
  it('shows loading state on mount', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<WcagCriteria statuses={[]} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no criteria data', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });
    render(<WcagCriteria statuses={[]} />);
    await waitFor(() =>
      expect(screen.getByText(/No issues logged for Perceivable criteria yet/)).toBeInTheDocument()
    );
  });

  it('shows error state when API fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: false, error: 'DB error' }),
    });
    render(<WcagCriteria statuses={[]} />);
    await waitFor(() =>
      expect(screen.getByText('Failed to load WCAG criteria.')).toBeInTheDocument()
    );
  });

  it('renders criteria rows with code, name, and count', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: mockCriteriaData }),
    });
    render(<WcagCriteria statuses={[]} />);
    await waitFor(() => expect(screen.getByText('1.1.1')).toBeInTheDocument());
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('1.4.3')).toBeInTheDocument();
    expect(screen.getByText('Contrast (Minimum)')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has four principle tabs defaulting to Perceivable', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<WcagCriteria statuses={[]} />);
    ['Perceivable', 'Operable', 'Understandable', 'Robust'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Perceivable' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('switches active principle when tab is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });
    render(<WcagCriteria statuses={[]} />);
    await waitFor(() => screen.getByText(/No issues logged/));
    fireEvent.click(screen.getByRole('button', { name: 'Operable' }));
    expect(screen.getByRole('button', { name: 'Operable' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Perceivable' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
