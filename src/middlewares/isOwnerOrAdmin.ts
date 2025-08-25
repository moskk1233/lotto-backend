import { createMiddleware } from 'hono/factory';
import z from 'zod';

export const isOwnerOrAdmin = createMiddleware(async (c, next) => {
  const userJwtClaim = c.get('jwtPayload') as { userId: number; role: string };

  if (userJwtClaim.role === 'admin') {
    return await next();
  }

  const param = c.req.param('id');

  const paramResult = z.coerce.number().int().safeParse(param);
  if (!paramResult.success) {
    return c.json(
      {
        error: {
          status: 400,
          code: 'BAD_REQUEST',
          detail: 'ID is not number',
        },
      },
      400,
    );
  }

  const paramId = paramResult.data;
  if (userJwtClaim.userId != paramId) {
    return c.json(
      {
        error: {
          status: 403,
          code: 'UNAUTHORIZED',
          detail: "Current token can't access this resource",
        },
      },
      403,
    );
  }

  await next();
});
