import { z } from 'zod';

export const STANDARD_EDITIONS = ['WCAG', '508', 'EU', 'INT'] as const;
export const PRODUCT_SCOPES = [
  'web',
  'software-desktop',
  'software-mobile',
  'documents',
  'hardware',
  'telephony',
] as const;

export const CreateVpatSchema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().min(1),
  standard_edition: z.enum(STANDARD_EDITIONS).default('WCAG'),
  wcag_version: z.enum(['2.1', '2.2']).default('2.1'),
  wcag_level: z.enum(['A', 'AA', 'AAA']).default('AA'),
  product_scope: z.array(z.enum(PRODUCT_SCOPES)).min(1).default(['web']),
  description: z.string().max(1000).nullable().optional(),
});

export const UpdateVpatSchema = z
  .object({
    title: z.string().min(1).max(200),
  })
  .partial();

export type CreateVpatInput = z.infer<typeof CreateVpatSchema>;
export type UpdateVpatInput = z.infer<typeof UpdateVpatSchema>;
export type StandardEdition = (typeof STANDARD_EDITIONS)[number];
export type ProductScope = (typeof PRODUCT_SCOPES)[number];
