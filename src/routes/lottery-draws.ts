import { Hono } from 'hono';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import { LotterDrawService } from '../services/lottery-draws.js';
import { zValidator } from '@hono/zod-validator';
import { createDrawSchema } from '../dto/lottery-draws/create-draw.js';
import { internalError } from '../error/internal-error.js';
import z from 'zod';
import type { Prisma } from '../generated/prisma/index.js';

const route = new Hono();
const lotteryDrawService = LotterDrawService.getInstance();

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
route.get('/:id/lottery-tickets', requireRole('user', 'admin'));

// Create Lottery Ticket for Draw by ID
route.post('/:id/lottery-tickets', requireRole('admin'));

route.put('/:id', requireRole('admin'));

// Delete Lottery Draw by ID cascade to tickets
route.delete('/:id', requireRole('admin'));

export default route;
