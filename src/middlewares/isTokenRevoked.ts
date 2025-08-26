import { createMiddleware } from 'hono/factory';
import redis from '../redis.js';

export const isTokenRevoked = createMiddleware(async (c, next) => {
  const authorizationHeader = c.req.header('Authorization');
  const token = authorizationHeader!.split(' ')[1];

  if (await redis.exists(`revoked_token:${token}`)) {
    return c.json(
      {
        error: {
          status: 401,
          code: 'UNAUTHORIZED',
          detail: 'Invalid token',
        },
      },
      401,
    );
  }

  await next();
});
