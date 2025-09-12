import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  password: string;

  @ApiProperty({ example: 1000 })
  @IsOptional()
  @IsNumber()
  money: number;
}

export class UpdateUserByAdminDto extends UpdateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({ example: 'johndoe@mail.com' })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0888888888' })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  phone: string;

  @ApiProperty({ examples: ['user', 'admin'] })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
