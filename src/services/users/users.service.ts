import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/dto/users/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(user: CreateUserDto) {
    user.password = await argon2.hash(user.password);
    return await this.prisma.users.create({
      data: user,
      omit: {
        password: true,
      },
    });
  }

  async count() {
    return await this.prisma.users.count();
  }

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const take = limit;

    return await this.prisma.users.findMany({
      skip,
      take,
      omit: {
        password: true,
      },
    });
  }

  async getById(id: number) {
    return await this.prisma.users.findUnique({
      where: {
        id,
      },
    });
  }

  async getByUsername(username: string) {
    return await this.prisma.users.findUnique({
      where: {
        username,
      },
    });
  }

  async checkUniqueField({
    username,
    email,
    phone,
  }: {
    username?: string;
    email?: string;
    phone?: string;
  }) {
    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          username ? { username } : undefined,
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as Prisma.UsersWhereInput[],
      },
      select: {
        username: true,
        email: true,
        phone: true,
      },
    });

    return user
      ? {
          usernameTaken: user.username === username,
          emailTaken: user.email === email,
          phoneTaken: user.phone === phone,
        }
      : { usernameTaken: false, emailTaken: false, phoneTaken: false };
  }
}
