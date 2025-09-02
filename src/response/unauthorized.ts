import type { Context } from 'hono';

export const unauthorizedResponse = (c: Context, data: unknown) => {
  return c.json(
    {
      error: {
        status: 401,
        code: 'UNAUTHORIZED',
        detail: data,
      },
    },
    401,
  );
};
