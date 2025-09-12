import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateTicketDto } from 'src/dto/tickets/create-ticket.dto';
import { UpdateTicketDto } from 'src/dto/tickets/update-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async count(options?: Prisma.LotteryTicketsCountArgs) {
    return await this.prisma.lotteryTickets.count(options);
  }

  async getAll(
    page: number,
    limit: number,
    options?: Prisma.LotteryTicketsFindManyArgs,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    return await this.prisma.lotteryTickets.findMany({
      skip,
      take,
      ...options,
    });
  }

  async getById(id: number) {
    return await this.prisma.lotteryTickets.findUnique({
      where: {
        id,
      },
    });
  }

  async getByNumber(ticketNumber: string) {
    return await this.prisma.lotteryTickets.findUnique({
      where: {
        ticketNumber,
      },
    });
  }

  async create(ticketDto: CreateTicketDto) {
    return await this.prisma.lotteryTickets.create({
      data: ticketDto,
    });
  }

  async update(id: number, ticketDto: UpdateTicketDto) {
    return await this.prisma.lotteryTickets.update({
      where: {
        id,
      },
      data: ticketDto,
    });
  }

  async delete(id: number) {
    return await this.prisma.lotteryTickets.delete({
      where: {
        id,
      },
    });
  }
}
