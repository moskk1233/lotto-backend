import z from 'zod';

export const createDrawSchema = z.object({
  drawDate: z.coerce.date(),
  name: z.string().max(100),
  status: z.enum(['open', 'closed']).default('open'),
});

export type CreateDrawDto = z.infer<typeof createDrawSchema>;
