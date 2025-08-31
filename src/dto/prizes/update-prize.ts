import z from 'zod';

export const updatePrizeSchema = z.object({
  prizeRank: z.int().optional(),
  prizeDescription: z.string().max(255).optional(),
  prizeAmount: z.int().optional(),
  winningTicketId: z.int().optional(),
});

export type UpdatePrizeDto = z.infer<typeof updatePrizeSchema>;
