import z from 'zod';

export const createTicketSchema = z.object({
  ticketNumber: z.string().min(6).max(6),
  ownerId: z.int().optional(),
  price: z.int(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema> & {
  drawId: number;
};
