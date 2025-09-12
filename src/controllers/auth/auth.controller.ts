import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from 'src/dto/auth/login.dto';
import { UsersService } from 'src/services/users/users.service';
import argon2 from 'argon2';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() loginDto: LoginDto) {
    const { username, password } = loginDto;

    const existedUser = await this.userService.getByUsername(username);
    if (!existedUser)
      throw new UnauthorizedException('username or password is invalid');

    const isVerified = await argon2.verify(existedUser.password, password);
    if (!isVerified)
      throw new UnauthorizedException('username or password is invalid');

    const token = await this.jwtService.signAsync({
      userId: existedUser.id,
      role: existedUser.role,
    });

    return {
      access_token: token,
    };
  }
}
