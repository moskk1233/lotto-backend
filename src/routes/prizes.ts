import { Hono } from 'hono';
import { requireRole } from '../middlewares/requireRole.js';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import { isTokenRevoked } from '../middlewares/isTokenRevoked.js';
import { zValidator } from '@hono/zod-validator';
import { createPrizeSchema } from '../dto/prizes/create-prize.js';
import { badRequest } from '../error/bad-request.js';
import { internalError } from '../error/internal-error.js';
import { PrizeService } from '../services/prizes.js';
import { parseId } from '../dto/shared/parseId.js';
import { updatePrizeSchema } from '../dto/prizes/update-prize.js';
import { notFound } from '../error/not-found.js';
import z from 'zod';

const route = new Hono();
const prizeService = PrizeService.getInstance();

route.use(jwtMiddleware);
route.use(isTokenRevoked);
route.use(requireRole('admin'));

// Get all Prize
route.get(
  '/',
  zValidator(
    'query',
    z.object({
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }),
    (result, c) => {
      if (!result.success) return badRequest(c, JSON.parse(result.error.message));
    },
  ),
  async (c) => {
    try {
      const { sort, order } = c.req.valid('query');

      const orderBy = sort ? { [sort]: order } : undefined;
      const prizes = await prizeService.getAll({
        orderBy,
      });

      return c.json({
        data: prizes,
      });
    } catch {
      return internalError(c);
    }
  },
);

route.get(
  '/:id',
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const existedPrize = await prizeService.getById(id);
      if (!existedPrize) return notFound(c, 'Prize is not found');

      return c.json({
        data: existedPrize,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Create Prize
route.post(
  '/',
  zValidator('json', createPrizeSchema, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');

      if (await prizeService.isRankTaken(body.prizeRank)) return badRequest(c, 'Rank is taken');
      if (await prizeService.isWinningIdTaken(body.winningTicketId))
        return badRequest(c, 'Winning ID is taken');

      const createdPrize = await prizeService.create(body);
      return c.json(
        {
          data: createdPrize,
        },
        201,
      );
    } catch {
      return internalError(c);
    }
  },
);

// Update by ID
route.put(
  '/:id',
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  zValidator('json', updatePrizeSchema, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const existedPrize = await prizeService.getById(id);
      if (!existedPrize) return notFound(c, 'Prize is not found');

      const isRankTaken = body.prizeRank
        ? await prizeService.isRankTaken(body.prizeRank)
        : undefined;
      const isWinningIdTaken = body.winningTicketId
        ? await prizeService.isWinningIdTaken(body.winningTicketId)
        : undefined;
      if (isRankTaken) return badRequest(c, 'Rank is taken');
      if (isWinningIdTaken) return badRequest(c, 'Winning ID is taken');

      const updatedPrize = await prizeService.update(id, body);
      return c.json({
        data: updatedPrize,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Delete by ID
route.delete(
  '/:id',
  zValidator('param', parseId, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const existedPrize = await prizeService.getById(id);
      if (!existedPrize) return notFound(c, 'Prize is not found');

      await prizeService.delete(id);
      return c.body(null, 204);
    } catch {
      return internalError(c);
    }
  },
);

export default route;
