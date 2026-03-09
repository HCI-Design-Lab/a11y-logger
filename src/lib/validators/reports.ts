import { z } from 'zod';

export const ReportContentSchema = z
  .object({
    executive_summary: z.object({ body: z.string() }).optional(),
    top_risks: z.object({ items: z.array(z.string()) }).optional(),
    quick_wins: z.object({ items: z.array(z.string()) }).optional(),
    user_impact: z
      .object({
        screen_reader: z.string(),
        low_vision: z.string(),
        color_vision: z.string(),
        keyboard_only: z.string(),
        cognitive: z.string(),
        deaf_hard_of_hearing: z.string(),
      })
      .optional(),
  })
  .strict();

const ReportBaseSchema = z.object({
  title: z.string().min(1).max(200),
  content: ReportContentSchema.optional(),
});

export const CreateReportSchema = ReportBaseSchema.extend({
  assessment_ids: z.array(z.string().min(1)).min(1),
});

export const UpdateReportSchema = ReportBaseSchema.partial().extend({
  assessment_ids: z.array(z.string().min(1)).min(1).optional(),
});

export type ReportContent = z.infer<typeof ReportContentSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type UpdateReportInput = z.infer<typeof UpdateReportSchema>;
