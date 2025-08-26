import prisma from '../db.js';
import type { CreateDrawDto } from '../dto/lottery-draws/create-draw.js';
import type { Prisma } from '../generated/prisma/index.js';

export class LotterDrawService {
  public static instance: LotterDrawService;

  public static getInstance() {
    if (!LotterDrawService.instance) {
      LotterDrawService.instance = new LotterDrawService();
    }

    return LotterDrawService.instance;
  }

  async count() {
    const result = await prisma.lotteryDraws.count();

    return result;
  }

  async getAll(
    limit: number,
    offset: number,
    orderBy: Prisma.LotteryDrawsOrderByWithRelationInput,
  ) {
    const result = await prisma.lotteryDraws.findMany({
      skip: offset,
      take: limit,
      orderBy,
    });

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
}
