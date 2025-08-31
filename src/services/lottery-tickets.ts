import prisma from '../db.js';
import type { CreateTicketDto } from '../dto/lottery-tickets/create-ticket.js';
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

  async create(newTicket: CreateTicketDto) {
    const result = await prisma.lotteryTickets.create({
      data: newTicket,
    });

    return result;
  }
}
