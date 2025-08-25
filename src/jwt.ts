import { sign } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';

export function signToken(payload: JWTPayload, exp: number) {
  const now = Math.floor(Date.now() / 1000);

  return sign(
    {
      iat: now,
      exp: now + exp,
      ...payload,
    },
    process.env.JWT_SECRET!,
    'HS256',
  );
}
