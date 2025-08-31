import prisma from '../db.js';
import type { CreateDrawDto } from '../dto/lottery-draws/create-draw.js';
import type { UpdateDrawDto } from '../dto/lottery-draws/update-draw.js';
import type { Prisma } from '../generated/prisma/index.js';

export class LotterDrawService {
  public static instance: LotterDrawService;

  public static getInstance() {
    if (!LotterDrawService.instance) {
      LotterDrawService.instance = new LotterDrawService();
    }

    return LotterDrawService.instance;
  }

  async count(options?: Prisma.LotteryDrawsCountArgs) {
    const result = await prisma.lotteryDraws.count(options);
    return result;
  }

  async getAll(options?: Prisma.LotteryDrawsFindFirstArgs) {
    const result = await prisma.lotteryDraws.findMany(options);
    return result;
  }

  async getById(id: number) {
    const result = await prisma.lotteryDraws.findUnique({
      where: {
        id,
      },
    });

    return result;
  }

  async create(draw: CreateDrawDto) {
    const result = await prisma.lotteryDraws.create({
      data: draw,
    });

    return result;
  }

  async updateById(id: number, draw: UpdateDrawDto) {
    const result = await prisma.lotteryDraws.update({
      where: {
        id,
      },
      data: draw,
    });

    return result;
  }

  async deleteById(id: number) {
    const result = await prisma.lotteryDraws.delete({
      where: {
        id,
      },
    });

    return result;
  }
}
