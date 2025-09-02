import type { Context } from 'hono';

export const forbiddonResponse = (c: Context, data: unknown) => {
  return c.json(
    {
      error: {
        status: 403,
        code: 'FORBIDDON',
        detail: data,
      },
    },
    403,
  );
};
