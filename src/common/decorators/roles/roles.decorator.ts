import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...args: UserRoleEnum[]) => SetMetadata(ROLES_KEY, args);
