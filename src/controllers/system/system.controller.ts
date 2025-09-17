import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import argon2 from 'argon2';

@Controller('system')
export class SystemController {
  constructor(private prisma: PrismaService) {}

  @Get('reset')
  async resetSystem() {
    await this.prisma.prizes.deleteMany({});
    await this.prisma.lotteryTickets.deleteMany({});
    await this.prisma.users.deleteMany({});

    const passwordHashed = await argon2.hash('admin');

    await this.prisma.users.create({
      data: {
        email: 'admin@mail.cmo',
        phone: '0000000000',
        username: 'admin',
        role: 'admin',
        money: 0,
        password: passwordHashed,
      },
    });

    return {
      message: 'System reset successfully',
    };
  }
}
