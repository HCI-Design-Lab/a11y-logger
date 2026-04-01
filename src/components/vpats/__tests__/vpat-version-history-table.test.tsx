import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VpatVersionHistoryTable } from '@/components/vpats/vpat-version-history-table';

const snapshots = [
  {
    id: 's1',
    vpat_id: 'v1',
    version_number: 2,
    published_at: '2026-03-15T10:00:00',
    created_at: '2026-03-15T10:00:00',
  },
  {
    id: 's2',
    vpat_id: 'v1',
    version_number: 1,
    published_at: '2026-01-10T09:00:00',
    created_at: '2026-01-10T09:00:00',
  },
];

describe('VpatVersionHistoryTable', () => {
  it('does not render a Version History card title', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.queryByText('Version History')).not.toBeInTheDocument();
  });

  it('version numbers are links to the version page', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    const v2Link = screen.getByRole('link', { name: 'v2' });
    const v1Link = screen.getByRole('link', { name: 'v1' });
    expect(v2Link).toHaveAttribute('href', '/vpats/v1/versions/2');
    expect(v1Link).toHaveAttribute('href', '/vpats/v1/versions/1');
  });

  it('renders Version column header', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.getByRole('button', { name: 'Version' })).toBeInTheDocument();
  });

  it('renders Published column header', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.getByRole('button', { name: 'Published' })).toBeInTheDocument();
  });

  it('renders Created At column header', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.getByRole('button', { name: 'Created At' })).toBeInTheDocument();
  });

  it('does not render an Actions column', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('does not render View links', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument();
  });

  it('displays version numbers', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={snapshots} />);
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('shows empty state when no snapshots', () => {
    render(<VpatVersionHistoryTable vpatId="v1" snapshots={[]} />);
    expect(
      screen.getByText('No published versions yet. Publish this VPAT to create a snapshot.')
    ).toBeInTheDocument();
  });
});
