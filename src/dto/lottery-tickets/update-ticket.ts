import z from 'zod';

export const updateTicketSchema = z.object({
  ticketNumber: z.string().min(6).max(6).optional(),
  price: z.coerce.number().int().optional(),
  ownerId: z.int().nullable().optional(),
});

export type UpdateTicketDto = z.infer<typeof updateTicketSchema>;
