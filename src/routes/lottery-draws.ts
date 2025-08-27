import { Hono } from 'hono';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import { LotterDrawService } from '../services/lottery-draws.js';
import { zValidator } from '@hono/zod-validator';
import { createDrawSchema } from '../dto/lottery-draws/create-draw.js';
import { internalError } from '../error/internal-error.js';
import z from 'zod';
import type { Prisma } from '../generated/prisma/index.js';
import { badRequest } from '../error/bad-request.js';
import { createTicketSchema } from '../dto/lottery-tickets/create-ticket.js';
import { LotteryTicketService } from '../services/lottery-tickets.js';

const route = new Hono();
const lotteryDrawService = LotterDrawService.getInstance();
const lotteryTicketService = LotteryTicketService.getInstance();

// Assign middleware for Lottery Draw Routes
route.use(jwtMiddleware);

// Get all Lottery Draws
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
      sort: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(',') : [])),
      order: z.enum(['asc', 'desc']).default('asc'),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json({
          error: {
            status: 400,
            code: 'BAD_REQUEST',
            detail: 'Sorry but your request is illegal',
          },
        });
      }
    },
  ),
  async (c) => {
    try {
      const { page, limit, sort, order } = c.req.valid('query');

      const offset = (page - 1) * limit;
      const drawCount = await lotteryDrawService.count();
      const pageCount = Math.ceil(drawCount / limit);

      const orderBy = sort.map((field) => ({
        [field]: order,
      })) as Prisma.LotteryDrawsOrderByWithAggregationInput;

      const lotteryDraws = await lotteryDrawService.getAll(limit, offset, orderBy);

      return c.json({
        data: lotteryDraws,
        meta: {
          page,
          pageCount,
        },
      });
    } catch {
      return internalError(c);
    }
  },
);

// Get all Lottery Draw by ID
route.get(
  '/:id',
  requireRole('user', 'admin'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().int(),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              status: 400,
              code: 'BAD_REQUEST',
              detail: JSON.parse(result.error.message),
            },
          },
          400,
        );
      }
    },
  ),
  async (c) => {
    try {
      const { id } = c.req.valid('param');

      const lotteryDraw = await lotteryDrawService.getById(id);
      return c.json({
        data: lotteryDraw,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Create Lottery Draw
route.post(
  '/',
  requireRole('admin'),
  zValidator('json', createDrawSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            status: 400,
            code: 'BAD_REQUEST',
            detail: JSON.parse(result.error.message),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const createdDraw = await lotteryDrawService.create(body);

      return c.json(
        {
          data: createdDraw,
        },
        201,
      );
    } catch {
      return internalError(c);
    }
  },
);

// Get Lottery Ticket from Lottery Draw by ID
route.get(
  '/:id/lottery-tickets',
  requireRole('user', 'admin'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().int(),
    }),
    (result, c) => {
      if (!result.success) return badRequest(c, JSON.parse(result.error.message));
    },
  ),
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
      order: z.enum(['asc', 'desc']).default('asc'),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json({
          error: {
            status: 400,
            code: 'BAD_REQUEST',
            detail: 'Sorry but your request is illegal',
          },
        });
      }
    },
  ),
  async (c) => {
    try {
      const { page, limit, sort, order } = c.req.valid('query');
      const { id } = c.req.valid('param');

      const offset = (page - 1) * limit;
      const ticketCount = await lotteryTicketService.count({
        where: {
          drawId: id,
        },
      });
      console.log(ticketCount);
      const pageCount = Math.ceil(ticketCount / limit);

      const lotteryTickets = await lotteryTicketService.getAll({
        pagination: {
          skip: offset,
          take: limit,
        },
        sorting: {
          order,
          sort,
        },
        where: {
          drawId: id,
        },
        omit: {
          drawId: true,
        },
      });

      return c.json({
        data: lotteryTickets,
        meta: {
          page,
          pageCount,
        },
      });
    } catch {
      return internalError(c);
    }
  },
);

// Create Lottery Ticket for Draw by ID
route.post(
  '/:id/lottery-tickets',
  requireRole('admin'),
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().int(),
    }),
    (result, c) => {
      if (!result.success) return badRequest(c, JSON.parse(result.error.message));
    },
  ),
  zValidator('json', createTicketSchema, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    try {
      const newTicket = await lotteryTicketService.create({
        drawId: id,
        ticketNumber: body.ticketNumber,
        ownerId: body.ownerId,
      });

      return c.json({
        data: newTicket,
      });
    } catch {
      return internalError(c);
    }
  },
);

route.put('/:id', requireRole('admin'));

// Delete Lottery Draw by ID cascade to tickets
route.delete('/:id', requireRole('admin'));

export default route;
