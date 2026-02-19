import { z } from 'zod';

export const SettingValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const UpdateSettingSchema = z.object({
  value: SettingValueSchema,
});

export const BatchUpdateSettingsSchema = z.record(z.string(), SettingValueSchema);

export type SettingValue = z.infer<typeof SettingValueSchema>;
export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>;
export type BatchUpdateSettingsInput = z.infer<typeof BatchUpdateSettingsSchema>;
