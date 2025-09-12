import { UserRoleEnum } from 'src/common/enums/user-role.enum';

export interface UserClaim {
  userId: number;
  role: UserRoleEnum;
  iat: number;
  exp: number;
}
