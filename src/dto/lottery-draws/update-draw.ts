import z from 'zod';

export const updateDrawSchema = z.object({
  drawDate: z.coerce.date().optional(),
  name: z.string().max(100).optional(),
  status: z.enum(['open', 'closed']).optional(),
});

export type UpdateDrawDto = z.infer<typeof updateDrawSchema>;
