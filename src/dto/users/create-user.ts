import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.email(),
  phone: z.string().min(10).max(10),
  money: z.number().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
