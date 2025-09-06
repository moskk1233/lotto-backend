import prisma from '../db.js';
import type { CreateUserDto } from '../dto/users/create-user.js';
import argon2 from 'argon2';
import type { UpdateUserDto } from '../dto/users/update-user.js';
import type { Prisma } from '../generated/prisma/index.js';

export class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }

    return UserService.instance;
  }

  async count(options?: Prisma.UsersCountArgs) {
    const userCount = await prisma.users.count({
      where: options?.where,
    });

    return userCount;
  }

  async getAll(options?: Prisma.UsersFindManyArgs) {
    const users = await prisma.users.findMany({
      ...options,
      omit: {
        password: true,
      },
    });
    return users;
  }

  async getById(id: number) {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
      omit: {
        password: true,
      },
    });
    return user;
  }

  async getByUsername(username: string) {
    const user = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    return user;
  }

  async create(user: CreateUserDto) {
    user.password = await argon2.hash(user.password);
    const createdUser = await prisma.users.create({
      data: {
        ...user,
      },
      omit: {
        password: true,
      },
    });

    return createdUser;
  }

  async updateById(id: number, user: UpdateUserDto) {
    if (user.password) {
      user.password = await argon2.hash(user.password);
    }

    const updatedUser = await prisma.users.update({
      where: {
        id,
      },
      data: {
        ...user,
      },
      omit: {
        password: true,
      },
    });

    return updatedUser;
  }

  async deleteById(id: number) {
    const deletedUser = await prisma.users.delete({
      where: {
        id,
      },
      omit: {
        password: true,
      },
    });

    return deletedUser;
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
    const user = await prisma.users.findFirst({
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

  async buyTicket(userId: number, ticketId: number, price: number) {
    const [, updatedTicket] = await prisma.$transaction([
      prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          money: {
            decrement: price,
          },
        },
      }),
      prisma.lotteryTickets.update({
        where: {
          id: ticketId,
        },
        data: {
          ownerId: userId,
        },
      }),
    ]);

    return updatedTicket;
  }

  async claimPrize(userId: number, prizeId: number) {
    return await prisma.$transaction(async (tx) => {
      const prize = await tx.prizes.findUnique({
        where: {
          id: prizeId,
        },
        include: {
          winningTicket: true,
        },
      });

      if (!prize) {
        throw new Error('PRIZE_NOT_FOUND');
      }

      if (prize.winningTicket?.ownerId !== userId) {
        throw new Error('NOT_PRIZE_OWNER');
      }

      if (prize.status == 'claimed') {
        throw new Error('PRIZE_ALREADY_CLAIMED');
      }

      if (!prize.winningTicketId) {
        throw new Error('WINNING_TICKET_NOT_FOUND');
      }

      // Update user's money
      await tx.users.update({
        where: {
          id: userId,
        },
        data: {
          money: {
            increment: prize.prizeAmount,
          },
        },
      });

      // Mark prize as claimed
      const updatedPrize = await tx.prizes.update({
        where: {
          id: prizeId,
        },
        data: {
          status: 'claimed',
        },
      });

      return updatedPrize;
    });
  }
}
