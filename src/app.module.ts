import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma/prisma.service';
import { UsersController } from './controllers/users/users.controller';
import { UsersService } from './services/users/users.service';
import { AuthController } from './controllers/auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from './services/redis/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
          algorithm: 'HS512',
          issuer: 'Lotto 888',
        },
        verifyOptions: { algorithms: ['HS512'] },
      }),
    }),
  ],
  controllers: [AppController, UsersController, AuthController],
  providers: [AppService, PrismaService, UsersService, RedisService],
})
export class AppModule {}
