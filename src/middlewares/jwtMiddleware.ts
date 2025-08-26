import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const jwtMiddleware = createMiddleware(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    const token = authHeader.split(' ')[1];

    const decode = await verify(token, process.env.JWT_SECRET!);

    c.set('jwtPayload', decode);

    await next();
  } catch {
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
});
