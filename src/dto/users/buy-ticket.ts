import z from 'zod';

export const buyTicketSchema = z.object({
  ticketNumber: z.string().min(6).max(6),
});

export type BuyTicketDto = z.infer<typeof buyTicketSchema>;
