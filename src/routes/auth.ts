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

const route = new Hono();
const userService = UserService.getInstance();

route.post(
  '/token',
  zValidator('json', loginSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            status: 400,
            code: 'BAD_REQUEST',
            detail: JSON.parse(result.error.message),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    try {
      const { username, password } = c.req.valid('json');

      const existedUser = await userService.getByUsername(username);

      if (!existedUser) {
        return c.json(
          {
            error: {
              status: 401,
              code: 'UNAUTHORIZED',
              detail: 'username or password is invalid',
            },
          },
          401,
        );
      }

      const isVerified = await argon2.verify(existedUser.password, password);
      if (!isVerified) {
        return c.json(
          {
            error: {
              status: 401,
              code: 'UNAUTHORIZED',
              detail: 'username or password is invalid',
            },
          },
          401,
        );
      }

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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
    return c.json(
      {
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          detail: 'Something went wrong please try again',
        },
      },
      500,
    );
  }
});

export default route;
