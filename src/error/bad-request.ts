import type { Context } from 'hono';

export const badRequest = <T>(c: Context, detail: T) => {
  return c.json(
    {
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        detail,
      },
    },
    400,
  );
};
