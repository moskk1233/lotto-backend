import z from 'zod';

export const updateUserSchema = z.object({
  password: z.string().optional(),
  money: z.number().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
