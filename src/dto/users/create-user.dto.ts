import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  username: string;

  @ApiProperty({ example: '123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'johndoe@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0888888888' })
  @IsString()
  @Length(10, 10)
  phone: string;

  @ApiProperty({ example: 1000 })
  @IsOptional()
  @IsNumber()
  money?: number;
}
