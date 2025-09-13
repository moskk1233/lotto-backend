import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from 'src/dto/auth/login.dto';
import { UsersService } from 'src/services/users/users.service';
import argon2 from 'argon2';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/middlewares/auth/auth.guard';
import { RedisService } from 'src/services/redis/redis.service';
import { UserClaim } from 'src/common/types/user-claim';
import { ACCESS_TOKEN } from 'src/constant';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  @Post('token')
  @ApiOperation({ summary: 'ขอ access token จาก username และ password' })
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

  @Delete('token')
  @ApiBearerAuth(ACCESS_TOKEN)
  @ApiOperation({ summary: 'ทำลาย access token' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async signOut(@Headers('Authorization') authorization: string) {
    const [type, token] = authorization.split(' ') ?? [];
    const accessToken = type === 'Bearer' ? token : undefined;
    if (!accessToken) return;

    const userClaim: UserClaim = this.jwtService.decode(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const ttl = userClaim.exp - now;

    if (ttl > 0) {
      await this.redisService.set(
        `revoked_token:${accessToken}`,
        String(userClaim.userId),
        ttl,
      );
    }
  }
}
