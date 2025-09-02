import { Hono } from 'hono';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import { isTokenRevoked } from '../middlewares/isTokenRevoked.js';
import { requireRole } from '../middlewares/requireRole.js';
import { LotteryTicketService } from '../services/lottery-tickets.js';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';
import { badRequestResponse } from '../response/bad-request.js';
import { internalErrorResponse } from '../response/internal-error.js';
import { createTicketSchema } from '../dto/lottery-tickets/create-ticket.js';
import { parseId } from '../dto/shared/parseId.js';
import { notFoundResponse } from '../response/not-found.js';
import { updateTicketSchema } from '../dto/lottery-tickets/update-ticket.js';

const route = new Hono();
const lotteryTicketService = LotteryTicketService.getInstance();

route.use(jwtMiddleware);
route.use(isTokenRevoked);

// Get All
route.get(
  '/',
  requireRole('user', 'admin'),
  zValidator(
    'query',
    z.object({
      page: z.coerce
        .number()
        .default(1)
        .transform((val) => Math.max(val, 1)),
      limit: z.coerce
        .number()
        .default(20)
        .transform((val) => Math.max(val, 1)),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
      q: z.string().max(6).optional(),
    }),
    (result, c) => {
      if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
    },
  ),
  async (c) => {
    try {
      const { limit, page, order, sort, q } = c.req.valid('query');
      const offset = (page - 1) * limit;

      const where = q ? { ticketNumber: { contains: q } } : undefined;

      const ticketCount = await lotteryTicketService.count({ where });
      const pageCount = Math.ceil(ticketCount / limit);

      const orderBy = sort ? { [sort]: order } : undefined;
      const tickets = await lotteryTicketService.getAll({
        skip: offset,
        take: limit,
        orderBy,
        where,
      });

      return c.json({
        data: tickets,
        meta: {
          page,
          pageCount,
        },
      });
    } catch {
      return internalErrorResponse(c);
    }
  },
);

// Create
route.post(
  '/',
  requireRole('admin'),
  zValidator('json', createTicketSchema, (result, c) => {
    if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const existedTicket = await lotteryTicketService.getByNumber(body.ticketNumber);
      if (existedTicket) return badRequestResponse(c, 'Existed ticket number');

      const createdTicket = await lotteryTicketService.create(body);
      return c.json(
        {
          data: createdTicket,
        },
        201,
      );
    } catch {
      return internalErrorResponse(c);
    }
  },
);

// Get by ID
route.get(
  '/:id',
  requireRole('user', 'admin'),
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');

      const existedTicket = await lotteryTicketService.getById(id);
      if (!existedTicket) return notFoundResponse(c, 'Ticket is not found');

      return c.json({
        data: existedTicket,
      });
    } catch {
      return internalErrorResponse(c);
    }
  },
);

// Update by ID
route.put(
  '/:id',
  requireRole('admin'),
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
  }),
  zValidator('json', updateTicketSchema, (result, c) => {
    if (!result.success) return badRequestResponse(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const existedTicket = await lotteryTicketService.getById(id);
      if (!existedTicket) return notFoundResponse(c, 'Ticket is not found');

      const updatedTicket = await lotteryTicketService.update(id, body);
      return c.json({
        data: updatedTicket,
      });
    } catch (e) {
      console.log(e);
      return internalErrorResponse(c);
    }
  },
);

// Delete by ID
route.delete(
  '/:id',
  requireRole('admin'),
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequestResponse(c, result.error.message);
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const existedTicket = await lotteryTicketService.getById(id);
      if (!existedTicket) return notFoundResponse(c, 'Ticket is not found');

      await lotteryTicketService.delete(id);
      return c.body(null, 204);
    } catch {
      return internalErrorResponse(c);
    }
  },
);

export default route;
