import z from 'zod';

export const createPrizeSchema = z.object({
  prizeRank: z.int(),
  prizeDescription: z.string().max(255),
  prizeAmount: z.int(),
  winningTicketId: z.int(),
});

export type CreatePrizeDto = z.infer<typeof createPrizeSchema>;
