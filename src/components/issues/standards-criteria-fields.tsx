'use client';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { WcagSelector } from './wcag-selector';
import { Section508Selector } from './section508-selector';
import { EuSelector } from './eu-selector';
import type { CreateIssueInput } from '@/lib/validators/issues';

interface StandardsCriteriaFieldsProps {
  control: Control<CreateIssueInput>;
  disabled: boolean;
}

export function StandardsCriteriaFields({ control, disabled }: StandardsCriteriaFieldsProps) {
  return (
    <>
      {/* WCAG Criteria */}
      <div className="space-y-1.5">
        <Label>WCAG Criteria</Label>
        <Controller
          name="wcag_codes"
          control={control}
          render={({ field }) => (
            <WcagSelector
              selected={(field.value ?? []) as string[]}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Section 508 Criteria */}
      <div className="space-y-1.5">
        <Label>Section 508 Criteria</Label>
        <Controller
          name="section_508_codes"
          control={control}
          render={({ field }) => (
            <Section508Selector
              selected={(field.value ?? []) as string[]}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* EU EN 301 549 Criteria */}
      <div className="space-y-1.5">
        <Label>EU EN 301 549 Criteria</Label>
        <Controller
          name="eu_codes"
          control={control}
          render={({ field }) => (
            <EuSelector
              selected={(field.value ?? []) as string[]}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>
    </>
  );
}
