import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VpatIssuesPanel } from '@/components/vpats/vpat-issues-panel';

const issues = [
  {
    id: '1',
    title: 'Missing alt text',
    severity: 'high',
    description: 'Image lacks alt attribute.',
    url: 'https://example.com/page',
  },
];

describe('VpatIssuesPanel', () => {
  it('renders issue title and severity', () => {
    render(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders criterion code in header', () => {
    render(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText(/1.1.1/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when no issues', () => {
    render(<VpatIssuesPanel issues={[]} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it('renders issue URL as a link', () => {
    render(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByRole('link', { name: /example.com/i })).toBeInTheDocument();
  });

  it('renders issue description', () => {
    render(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText('Image lacks alt attribute.')).toBeInTheDocument();
  });
});
