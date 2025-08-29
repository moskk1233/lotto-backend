import z from 'zod';

export const parseId = z.object({
  id: z.coerce.number().int(),
});
