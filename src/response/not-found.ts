import type { Context } from 'hono';

export const notFoundResponse = <T>(c: Context, detail: T) => {
  return c.json(
    {
      error: {
        status: 404,
        code: 'NOT_FOUND',
        detail,
      },
    },
    404,
  );
};
