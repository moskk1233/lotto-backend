import { createMiddleware } from 'hono/factory';

export const requireRole = (...roles: string[]) => {
  return createMiddleware(async (c, next) => {
    const payload = c.get('jwtPayload') as { userId: number; role: string };
    console.log(payload);
    if (!roles.includes(payload.role)) {
      return c.json(
        {
          error: {
            status: 403,
            code: 'FORBIDDON',
            detail: "Current token can't access this resource",
          },
        },
        403,
      );
    }

    await next();
  });
};
