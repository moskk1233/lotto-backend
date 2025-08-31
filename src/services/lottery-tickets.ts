import prisma from '../db.js';
import type { CreateTicketDto } from '../dto/lottery-tickets/create-ticket.js';
import type { UpdateTicketDto } from '../dto/lottery-tickets/update-ticket.js';
import type { Prisma } from '../generated/prisma/index.js';

export class LotteryTicketService {
  public static instance: LotteryTicketService;

  public static getInstance() {
    if (!LotteryTicketService.instance) {
      LotteryTicketService.instance = new LotteryTicketService();
    }

    return LotteryTicketService.instance;
  }

  async count(options?: Prisma.LotteryTicketsCountArgs) {
    const result = await prisma.lotteryTickets.count(options);

    return result;
  }

  async getAll(options?: Prisma.LotteryTicketsFindManyArgs) {
    const result = await prisma.lotteryTickets.findMany(options);

    return result;
  }

  async getById(id: number) {
    const result = await prisma.lotteryTickets.findUnique({
      where: {
        id,
      },
      omit: {
        ownerId: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return result;
  }

  async getByNumber(ticketNumber: string) {
    const result = await prisma.lotteryTickets.findUnique({
      where: {
        ticketNumber,
      },
    });

    return result;
  }

  async create(newTicket: CreateTicketDto) {
    const result = await prisma.lotteryTickets.create({
      data: newTicket,
    });

    return result;
  }

  async update(id: number, ticket: UpdateTicketDto) {
    const result = await prisma.lotteryTickets.update({
      where: {
        id,
      },
      data: ticket,
    });

    return result;
  }

  async delete(id: number) {
    const result = await prisma.lotteryTickets.delete({
      where: {
        id,
      },
    });

    return result;
  }
}
