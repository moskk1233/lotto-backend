import prisma from '../db.js';
import type { CreateTicketDto } from '../dto/lottery-tickets/create-ticket.js';
import type { LotteryTickets, Prisma } from '../generated/prisma/index.js';
import type { BasePagination, BaseSorting } from '../types/types.js';

interface TicketQueryOptions {
  pagination?: BasePagination;
  sorting?: BaseSorting;
  omit?: Partial<Record<keyof LotteryTickets, boolean>>;
  where?: Prisma.LotteryTicketsWhereInput;
}

export class LotteryTicketService {
  public static instance: LotteryTicketService;

  public static getInstance() {
    if (!LotteryTicketService.instance) {
      LotteryTicketService.instance = new LotteryTicketService();
    }

    return LotteryTicketService.instance;
  }

  async count(options: TicketQueryOptions) {
    const { pagination, where } = options;
    const result = await prisma.lotteryTickets.count({
      skip: pagination?.skip,
      take: pagination?.take,
      where,
    });

    return result;
  }

  async getAll(options: TicketQueryOptions) {
    const { pagination, omit, sorting, where } = options;
    const result = await prisma.lotteryTickets.findMany({
      skip: pagination?.skip,
      take: pagination?.take,
      omit,
      orderBy: sorting?.sort && sorting?.order ? { [sorting.sort]: sorting.order } : undefined,
      where,
    });

    return result;
  }

  async create(newTicket: CreateTicketDto) {
    const result = await prisma.lotteryTickets.create({
      data: newTicket,
    });

    return result;
  }
}
