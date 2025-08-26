import z from 'zod';

export const updateUserSchema = z.object({
  password: z.string().optional(),
  money: z.int().optional(),
});

export const updateUserForAdminSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().min(10).max(10).optional(),
  role: z.enum(['user', 'admin']).optional(),
  money: z.number().optional(),
  status: z.enum(['pending', 'approved']).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserForAdminDto = z.infer<typeof updateUserForAdminSchema>;
