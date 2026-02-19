import { z } from 'zod';
import { WCAG_CRITERION_CODES } from '@/lib/constants/wcag';

const isValidCriterionCode = (code: string) =>
  (WCAG_CRITERION_CODES as readonly string[]).includes(code);

const CriterionRowSchema = z.object({
  criterion_code: z.string().refine(isValidCriterionCode, 'Invalid WCAG criterion code'),
  conformance: z.enum([
    'supports',
    'partially_supports',
    'does_not_support',
    'not_applicable',
    'not_evaluated',
  ]),
  remarks: z.string().max(2000).nullable().optional(),
  related_issue_ids: z.array(z.string()).default([]),
});

const wcagScopeSchema = z.array(
  z.string().refine(isValidCriterionCode, 'Invalid WCAG criterion code')
);

export const CreateVpatSchema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().min(1),
  wcag_scope: wcagScopeSchema.default([]),
  criteria_rows: z.array(CriterionRowSchema).default([]),
});

export const UpdateVpatSchema = z
  .object({
    title: z.string().min(1).max(200),
    wcag_scope: wcagScopeSchema,
    criteria_rows: z.array(CriterionRowSchema),
  })
  .partial();

export type CreateVpatInput = z.input<typeof CreateVpatSchema>;
export type UpdateVpatInput = z.infer<typeof UpdateVpatSchema>;
export type CriterionRow = z.infer<typeof CriterionRowSchema>;
