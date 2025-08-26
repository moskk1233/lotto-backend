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

  async count() {
    const userCount = await prisma.users.count();

    return userCount;
  }

  async getAll(limit: number, skip: number, where: Prisma.UsersWhereInput = {}) {
    const users = await prisma.users.findMany({
      skip,
      where,
      take: limit,
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

  async isUsernameTaken(username: string) {
    const user = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    return !!user;
  }

  async isEmailTaken(email: string) {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    return !!user;
  }

  async isPhoneTaken(phone: string) {
    const user = await prisma.users.findUnique({
      where: {
        phone,
      },
    });

    return !!user;
  }
}
