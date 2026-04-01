import { z } from 'zod';
import {
  WCAG_CRITERION_CODES,
  SECTION_508_CRITERION_CODES,
  EN301549_CRITERION_CODES,
} from '@/lib/constants';

const IssueBaseSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  url: z.string().url().optional().or(z.literal('')),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'resolved', 'wont_fix']).optional(),
  wcag_codes: z.array(z.enum(WCAG_CRITERION_CODES as unknown as [string, ...string[]])).optional(),
  section_508_codes: z
    .array(z.enum(SECTION_508_CRITERION_CODES as unknown as [string, ...string[]]))
    .optional(),
  eu_codes: z
    .array(z.enum(EN301549_CRITERION_CODES as unknown as [string, ...string[]]))
    .optional(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  browser: z.string().max(100).optional(),
  operating_system: z.string().max(100).optional(),
  assistive_technology: z.string().max(200).optional(),
  user_impact: z.string().max(2000).optional(),
  selector: z.string().max(500).optional(),
  code_snippet: z.string().max(5000).optional(),
  suggested_fix: z.string().max(5000).optional(),
  evidence_media: z.array(z.string()).optional(),
  tags: z.array(z.string().max(50)).optional(),
  created_by: z.string().max(200).optional(),
  ai_suggested_codes: z.array(z.string()).optional(),
  ai_confidence_score: z.number().nullable().optional(),
});

export const CreateIssueSchema = IssueBaseSchema;
export const UpdateIssueSchema = IssueBaseSchema.partial();

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
