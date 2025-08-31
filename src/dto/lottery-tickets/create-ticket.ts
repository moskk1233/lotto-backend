import z from 'zod';

export const createTicketSchema = z.object({
  ticketNumber: z.string().min(6).max(6),
  price: z.int(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
