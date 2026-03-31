import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IssueAnalysisSection } from '../issue-analysis-section';

// Mock all child components so we can inspect what props they receive
vi.mock('../issue-statistics', () => ({
  IssueStatistics: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="issue-statistics" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../pour-radar', () => ({
  PourRadar: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="pour-radar" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../wcag-criteria', () => ({
  WcagCriteria: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="wcag-criteria" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../status-filter', () => ({
  StatusFilter: ({
    statuses,
    onChange,
  }: {
    statuses: string[];
    onChange: (s: string[]) => void;
  }) => (
    <div data-testid="status-filter" data-statuses={statuses.join(',')}>
      <button onClick={() => onChange(['open', 'resolved'])}>Change</button>
    </div>
  ),
}));

describe('IssueAnalysisSection', () => {
  it('defaults to open status and shows subtitle', () => {
    render(<IssueAnalysisSection />);
    expect(screen.getByText('Issues across all projects')).toBeInTheDocument();
  });

  it('passes default statuses to all chart components', () => {
    render(<IssueAnalysisSection />);
    expect(screen.getByTestId('issue-statistics').dataset.statuses).toBe('open');
    expect(screen.getByTestId('pour-radar').dataset.statuses).toBe('open');
    expect(screen.getByTestId('wcag-criteria').dataset.statuses).toBe('open');
  });

  it('updates child statuses when filter changes', () => {
    render(<IssueAnalysisSection />);
    fireEvent.click(screen.getByText('Change'));
    expect(screen.getByTestId('issue-statistics').dataset.statuses).toBe('open,resolved');
    expect(screen.getByTestId('pour-radar').dataset.statuses).toBe('open,resolved');
    expect(screen.getByTestId('wcag-criteria').dataset.statuses).toBe('open,resolved');
  });

  it('renders the section heading', () => {
    render(<IssueAnalysisSection />);
    expect(screen.getByRole('heading', { name: 'Issue Analysis' })).toBeInTheDocument();
  });
});
