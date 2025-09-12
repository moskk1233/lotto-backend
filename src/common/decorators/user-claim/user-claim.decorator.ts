import { createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { UserClaim } from 'src/common/types/user-claim';

export const User = createParamDecorator((_, ctx) => {
  const request: Request = ctx.switchToHttp().getRequest();
  return request['user'] as UserClaim;
});
