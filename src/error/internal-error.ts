import type { Context } from 'hono';

export const internalError = (c: Context) => {
  return c.json(
    {
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        detail: 'Something went wrong please try again',
      },
    },
    500,
  );
};
