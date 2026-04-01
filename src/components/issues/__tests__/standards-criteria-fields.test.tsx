import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateIssueSchema } from '@/lib/validators/issues';
import type { CreateIssueInput } from '@/lib/validators/issues';
import { StandardsCriteriaFields } from '../standards-criteria-fields';

// Lightweight mocks so we don't load the full selector lists in unit tests
vi.mock('@/components/issues/wcag-selector', () => ({
  WcagSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="wcag-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/section508-selector', () => ({
  Section508Selector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="section508-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/eu-selector', () => ({
  EuSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="eu-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));

function Wrapper({ disabled }: { disabled?: boolean }) {
  const { control } = useForm<CreateIssueInput>({
    resolver: zodResolver(CreateIssueSchema),
    defaultValues: {
      wcag_codes: [],
      section_508_codes: [],
      eu_codes: [],
    },
  });
  return <StandardsCriteriaFields control={control} disabled={disabled ?? false} />;
}

describe('StandardsCriteriaFields', () => {
  it('renders WCAG Criteria label', () => {
    render(<Wrapper />);
    expect(screen.getByText(/wcag criteria/i)).toBeInTheDocument();
  });

  it('renders Section 508 Criteria label', () => {
    render(<Wrapper />);
    expect(screen.getByText(/section 508 criteria/i)).toBeInTheDocument();
  });

  it('renders EU EN 301 549 Criteria label', () => {
    render(<Wrapper />);
    expect(screen.getByText(/eu en 301 549/i)).toBeInTheDocument();
  });

  it('renders WcagSelector, Section508Selector, and EuSelector', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('wcag-selector')).toBeInTheDocument();
    expect(screen.getByTestId('section508-selector')).toBeInTheDocument();
    expect(screen.getByTestId('eu-selector')).toBeInTheDocument();
  });

  it('passes disabled=true to all selectors when disabled prop is true', () => {
    render(<Wrapper disabled={true} />);
    expect(screen.getByTestId('wcag-selector')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('section508-selector')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('eu-selector')).toHaveAttribute('data-disabled', 'true');
  });

  it('does not pass disabled attribute to selectors when disabled is false', () => {
    render(<Wrapper disabled={false} />);
    expect(screen.getByTestId('wcag-selector')).not.toHaveAttribute('data-disabled');
    expect(screen.getByTestId('section508-selector')).not.toHaveAttribute('data-disabled');
    expect(screen.getByTestId('eu-selector')).not.toHaveAttribute('data-disabled');
  });
});
