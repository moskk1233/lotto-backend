import z from 'zod';

export const createPrizeSchema = z.object({
  type: z.enum(['RANKED', 'LAST']),
  prizeDescription: z.string().max(255),
  prizeAmount: z.int(),
  ticketNumber: z.string(),
});

export type CreatePrizeDto = z.infer<typeof createPrizeSchema>;
