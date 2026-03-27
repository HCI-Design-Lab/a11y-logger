import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/issues/wcag-selector', () => ({
  WcagSelector: () => <div data-testid="wcag-selector" />,
}));
vi.mock('@/components/issues/section508-selector', () => ({
  Section508Selector: () => <div data-testid="section508-selector" />,
}));
vi.mock('@/components/issues/eu-selector', () => ({
  EuSelector: () => <div data-testid="eu-selector" />,
}));
vi.mock('@/components/issues/tag-input', () => ({
  TagInput: () => <div data-testid="tag-input" />,
}));
vi.mock('@/components/issues/media-uploader', () => ({
  MediaUploader: () => <div data-testid="media-uploader" />,
}));

import { IssueForm } from '../issue-form';
import type { AssessmentOption } from '../issue-form';

const assessmentOptions: AssessmentOption[] = [
  { id: 'a1', name: 'Q1 Audit', projectId: 'p1', projectName: 'My Project' },
  { id: 'a2', name: 'Q2 Audit', projectId: 'p2', projectName: 'Beta App' },
];

describe('IssueForm externalButtons prop', () => {
  it('renders internal Save and Cancel buttons when externalButtons is not set', () => {
    render(<IssueForm projectId="p1" onSubmit={vi.fn()} cancelHref="/back" />);
    expect(screen.getByRole('button', { name: /save issue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
  });

  it('hides internal buttons when externalButtons prop is provided', () => {
    render(
      <IssueForm projectId="p1" onSubmit={vi.fn()} cancelHref="/back" externalButtons="my-form" />
    );
    expect(screen.queryByRole('button', { name: /save issue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('sets the form id when externalButtons prop is provided', () => {
    const { container } = render(
      <IssueForm projectId="p1" onSubmit={vi.fn()} externalButtons="my-form" />
    );
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('id', 'my-form');
  });

  it('Save Issue button has an icon', () => {
    render(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /save issue/i });
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('Cancel button has an icon', () => {
    render(<IssueForm projectId="p1" onSubmit={vi.fn()} cancelHref="/back" />);
    const btn = screen.getByRole('link', { name: /cancel/i });
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });
});

describe('IssueForm assessment selector', () => {
  it('does not render an assessment selector when assessmentOptions is not provided', () => {
    render(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.queryByRole('combobox', { name: /assessment/i })).not.toBeInTheDocument();
  });

  it('renders an assessment selector when assessmentOptions is provided', () => {
    render(<IssueForm projectId="" onSubmit={vi.fn()} assessmentOptions={assessmentOptions} />);
    expect(screen.getByRole('combobox', { name: /assessment/i })).toBeInTheDocument();
  });

  it('shows all assessment options in the selector', () => {
    render(<IssueForm projectId="" onSubmit={vi.fn()} assessmentOptions={assessmentOptions} />);
    fireEvent.click(screen.getByRole('combobox', { name: /assessment/i }));
    expect(screen.getAllByText('My Project / Q1 Audit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Beta App / Q2 Audit').length).toBeGreaterThan(0);
  });

  it('calls onAssessmentChange with correct ids when an option is selected', () => {
    const onAssessmentChange = vi.fn();
    render(
      <IssueForm
        projectId=""
        onSubmit={vi.fn()}
        assessmentOptions={assessmentOptions}
        onAssessmentChange={onAssessmentChange}
      />
    );
    fireEvent.click(screen.getByRole('combobox', { name: /assessment/i }));
    // Click the visible listbox option
    fireEvent.click(screen.getByRole('option', { name: 'My Project / Q1 Audit' }));
    expect(onAssessmentChange).toHaveBeenCalledWith('a1', 'p1');
  });
});
