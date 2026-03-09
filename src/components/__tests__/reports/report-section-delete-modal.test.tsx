import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReportSectionDeleteModal } from '@/components/reports/report-section-delete-modal';

describe('ReportSectionDeleteModal', () => {
  it('renders section name in modal', () => {
    render(
      <ReportSectionDeleteModal
        sectionName="Executive Summary"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/Executive Summary/)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ReportSectionDeleteModal sectionName="Top Risks" onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <ReportSectionDeleteModal sectionName="Top Risks" onConfirm={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
