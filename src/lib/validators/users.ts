import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
  role: z.enum(['admin', 'member']).optional(),
});

export const UpdateUserSchema = z
  .object({
    username: z.string().min(1).max(50).optional(),
    password: z.string().min(8).max(100).optional(),
    role: z.enum(['admin', 'member']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
