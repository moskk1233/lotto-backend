import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePrizeDto } from 'src/dto/prizes/create-prize.dto';
import { UpdatePrizeDto } from 'src/dto/prizes/update-prize.dto';

@Injectable()
export class PrizesService {
  constructor(private prisma: PrismaService) {}

  async count(options?: Prisma.PrizesCountArgs) {
    return await this.prisma.prizes.count(options);
  }

  async getAll(
    page: number,
    limit: number,
    options?: Prisma.PrizesFindManyArgs,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    return await this.prisma.prizes.findMany({
      skip,
      take,
      ...options,
    });
  }

  async getById(id: number) {
    return await this.prisma.prizes.findUnique({
      where: {
        id,
      },
    });
  }

  async create(
    prizeDto: Omit<
      CreatePrizeDto & { winningTicketId: number },
      'type' | 'ticketNumber'
    >,
  ) {
    return await this.prisma.prizes.create({
      data: prizeDto,
    });
  }

  async createMany(
    prizeDto: Omit<
      CreatePrizeDto & { winningTicketId: number },
      'type' | 'ticketNumber'
    >[],
  ) {
    return await this.prisma.prizes.createMany({
      data: prizeDto,
    });
  }

  async update(id: number, prizeDto: UpdatePrizeDto) {
    return await this.prisma.prizes.update({
      where: {
        id,
      },
      data: prizeDto,
    });
  }

  async delete(id: number) {
    return await this.prisma.prizes.delete({
      where: {
        id,
      },
    });
  }

  async checkUniqueField({ winningTicketId }: { winningTicketId: number }) {
    const result = await this.prisma.prizes.findFirst({
      where: {
        OR: [winningTicketId ? { winningTicketId } : undefined].filter(
          Boolean,
        ) as Prisma.PrizesWhereInput[],
      },
    });

    return result
      ? {
          winningTicketIdTaken: result.winningTicketId === winningTicketId,
        }
      : {
          winningTicketIdTaken: false,
        };
  }
}
