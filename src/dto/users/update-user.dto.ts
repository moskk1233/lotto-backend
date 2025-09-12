import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { UserRoleEnum } from 'src/enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsNumber()
  money: number;
}

export class UpdateUserByAdminDto extends UpdateUserDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  phone: string;

  @IsOptional()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
