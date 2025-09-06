import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { loginSchema } from '../dto/auth/login.js';
import { UserService } from '../services/users.js';
import argon2 from 'argon2';
import { signToken } from '../jwt.js';
import { Duration } from '../utils.js';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import redis from '../redis.js';
import { isTokenRevoked } from '../middlewares/isTokenRevoked.js';
import { internalErrorResponse } from '../response/internal-error.js';
import { badRequestResponse } from '../response/bad-request.js';
import { unauthorizedResponse } from '../response/unauthorized.js';

const route = new Hono();
const userService = UserService.getInstance();

route.post(
  '/token',
  zValidator('json', loginSchema, (result, c) => {
    if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { username, password } = c.req.valid('json');

      const existedUser = await userService.getByUsername(username);

      if (!existedUser) return unauthorizedResponse(c, 'username or password is invalid');

      const isVerified = await argon2.verify(existedUser.password, password);
      if (!isVerified) return unauthorizedResponse(c, 'username or password is invalid');

      const jwtToken = await signToken(
        {
          userId: existedUser.id,
          role: existedUser.role,
        },
        Duration.hour(1),
      );

      return c.json({
        access_token: jwtToken,
      });
    } catch {
      return internalErrorResponse(c);
    }
  },
);

route.delete('/token', jwtMiddleware, isTokenRevoked, async (c) => {
  try {
    const authorizationHeader = c.req.header('Authorization');
    const token = authorizationHeader!.split(' ')[1];
    const userJwtClaim = c.get('jwtPayload') as { exp: number };
    const now = Math.floor(Date.now() / 1000);
    const result = await redis.setEx(`revoked_token:${token}`, userJwtClaim.exp - now, 'revoked');

    if (result !== 'OK') throw new Error();
    return c.body(null, 204);
  } catch {
    return internalErrorResponse(c);
  }
});

export default route;
