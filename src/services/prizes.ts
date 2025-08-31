import prisma from '../db.js';
import type { CreatePrizeDto } from '../dto/prizes/create-prize.js';
import type { UpdatePrizeDto } from '../dto/prizes/update-prize.js';
import type { Prisma } from '../generated/prisma/index.js';

export class PrizeService {
  public static instance: PrizeService;

  public static getInstance() {
    if (!PrizeService.instance) {
      PrizeService.instance = new PrizeService();
    }

    return PrizeService.instance;
  }

  async count(options?: Prisma.PrizesCountArgs) {
    return await prisma.prizes.count(options);
  }

  async getAll(options?: Prisma.PrizesFindManyArgs) {
    return await prisma.prizes.findMany(options);
  }

  async getById(id: number) {
    return await prisma.prizes.findUnique({
      where: {
        id,
      },
    });
  }

  async create(prize: CreatePrizeDto) {
    return await prisma.prizes.create({ data: prize });
  }

  async update(id: number, prize: UpdatePrizeDto) {
    return await prisma.prizes.update({
      where: {
        id,
      },
      data: prize,
    });
  }

  async delete(id: number) {
    return await prisma.prizes.delete({
      where: {
        id,
      },
    });
  }

  async isRankTaken(rank: number) {
    const result = await prisma.prizes.findUnique({
      where: {
        prizeRank: rank,
      },
    });

    return !!result;
  }

  async isWinningIdTaken(ticketId: number) {
    const result = await prisma.prizes.findUnique({
      where: {
        winningTicketId: ticketId,
      },
    });

    return !!result;
  }
}
