import { z } from 'zod';

const ContentSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const ReportBaseSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['executive', 'detailed', 'custom']).optional(),
  content: z.array(ContentSectionSchema).optional(),
  template_id: z.string().optional(),
  ai_generated: z.boolean().optional(),
});

export const CreateReportSchema = ReportBaseSchema.extend({
  project_id: z.string().min(1),
});

export const UpdateReportSchema = ReportBaseSchema.partial();

export type ContentSection = z.infer<typeof ContentSectionSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type UpdateReportInput = z.infer<typeof UpdateReportSchema>;
