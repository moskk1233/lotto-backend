import { Hono } from 'hono';
import { UserService } from '../services/users.js';
import { createUserSchema } from '../dto/users/create-user.js';
import { updateUserForAdminSchema, updateUserSchema } from '../dto/users/update-user.js';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { jwtMiddleware } from '../middlewares/jwtMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import type { Prisma } from '../generated/prisma/index.js';
import { isTokenRevoked } from '../middlewares/isTokenRevoked.js';
import { internalError } from '../error/internal-error.js';
import { buyTicketSchema } from '../dto/users/buy-ticket.js';
import { badRequest } from '../error/bad-request.js';
import { LotteryTicketService } from '../services/lottery-tickets.js';
import { PrizeService } from '../services/prizes.js';
import { notFound } from '../error/not-found.js';

const route = new Hono();
const userService = UserService.getInstance();
const lotteryTicketService = LotteryTicketService.getInstance();

// Create user
route.post(
  '/',
  zValidator('json', createUserSchema, (result, c) => {
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

      if (await userService.isUsernameTaken(body.username)) {
        return c.json(
          {
            error: {
              status: 400,
              code: 'BAD_REQUEST',
              detail: 'Username is existed',
            },
          },
          400,
        );
      }

      if (await userService.isEmailTaken(body.email)) {
        return c.json(
          {
            error: {
              status: 400,
              code: 'BAD_REQUEST',
              detail: 'Email is existed',
            },
          },
          400,
        );
      }

      if (await userService.isPhoneTaken(body.phone)) {
        return c.json(
          {
            error: {
              status: 400,
              code: 'BAD_REQUEST',
              detail: 'Phone is existed',
            },
          },
          400,
        );
      }

      const newUser = await userService.create(body);

      return c.json(
        {
          data: newUser,
        },
        201,
      );
    } catch {
      return internalError(c);
    }
  },
);

// Use middleware to below route
route.use(jwtMiddleware);
route.use(isTokenRevoked);

// Get all user
route.get(
  '/',
  requireRole('admin'),
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
      status: z.enum(['pending', 'approved']).optional(),
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
      const { page, limit, status } = c.req.valid('query');

      const where: Prisma.UsersWhereInput = {};
      if (status) where.status = status;

      const offset = (page - 1) * limit;
      const userCount = await userService.count({
        where,
      });
      const pageCount = Math.ceil(userCount / limit);

      const users = await userService.getAll({
        skip: offset,
        take: limit,
        where,
      });
      return c.json({
        data: users,
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

// Get current user
route.get('/@me', requireRole('user', 'admin'), async (c) => {
  const userJwtClaim = c.get('jwtPayload') as { userId: number };

  const user = await userService.getById(userJwtClaim.userId);
  return c.json({
    data: user,
  });
});

route.get(
  '/@me/lottery-tickets',
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
    }),
    (result, c) => {
      if (!result.success) return badRequest(c, JSON.parse(result.error.message));
    },
  ),
  async (c) => {
    try {
      const { limit, page, sort, order } = c.req.valid('query');
      const userClaim = c.get('jwtPayload') as { userId: number };

      const offset = (page - 1) * limit;
      const ticketCount = await lotteryTicketService.count({
        where: {
          ownerId: userClaim.userId,
        },
      });
      const pageCount = Math.ceil(ticketCount / limit);

      const orderBy = sort ? { [sort]: order } : undefined;

      const tickets = await lotteryTicketService.getAll({
        where: {
          ownerId: userClaim.userId,
        },
        skip: offset,
        take: limit,
        orderBy,
        omit: {
          ownerId: true,
        },
      });

      return c.json({
        data: tickets,
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

route.post(
  '/@me/lottery-tickets',
  requireRole('user', 'admin'),
  zValidator('json', buyTicketSchema, (result, c) => {
    if (!result.success) return badRequest(c, JSON.parse(result.error.message));
  }),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const existedTicket = await lotteryTicketService.getByNumber(body.ticketNumber);
      if (!existedTicket) return notFound(c, 'Ticket is not found');

      const userClaim = c.get('jwtPayload') as { userId: number };
      const userProfile = await userService.getById(userClaim.userId);
      if (!userProfile) return badRequest(c, 'User is invalid');
      if (userProfile.money.toNumber() < existedTicket.price) {
        return badRequest(c, "You don't have enough money to buy this ticket");
      }

      if (existedTicket.ownerId) {
        return badRequest(c, 'This ticket has already been sold');
      }

      const updatedTicket = await userService.buyTicket(
        userClaim.userId,
        existedTicket.id,
        existedTicket.price,
      );

      return c.json({
        data: updatedTicket,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Get prizes for the current user
route.get(
  '/@me/prizes',
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
    }),
    (result, c) => {
      if (!result.success) return badRequest(c, JSON.parse(result.error.message));
    },
  ),
  async (c) => {
    try {
      const { limit, page, sort, order } = c.req.valid('query');
      const userClaim = c.get('jwtPayload') as { userId: number };
      const prizeService = PrizeService.getInstance();

      const where: Prisma.PrizesWhereInput = {
        winningTicket: {
          ownerId: userClaim.userId,
        },
      };

      const offset = (page - 1) * limit;
      const prizeCount = await prizeService.count({
        where,
      });
      const pageCount = Math.ceil(prizeCount / limit);

      const orderBy = sort ? { [sort]: order } : undefined;

      const prizes = await prizeService.getAll({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          winningTicket: {
            select: {
              ticketNumber: true,
            },
          },
        },
      });

      return c.json({
        data: prizes,
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

route.post(
  '/@me/prizes/:id/claim',
  requireRole('user', 'admin'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  async (c) => {
    try {
      const userClaim = c.get('jwtPayload') as { userId: number };
      const { id } = c.req.valid('param');

      const updatedPrize = await userService.claimPrize(userClaim.userId, id);

      return c.json({ data: updatedPrize });
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case 'PRIZE_NOT_FOUND':
            return notFound(c, 'Prize not found');
          case 'NOT_PRIZE_OWNER':
            return c.json(
              {
                error: {
                  status: 403,
                  code: 'FORBIDDEN',
                  detail: 'You are not the owner of this prize',
                },
              },
              403,
            );
          case 'PRIZE_ALREADY_CLAIMED':
            return badRequest(c, 'This prize has already been claimed');
          case 'WINNING_TICKET_NOT_FOUND':
            return notFound(c, 'Associated winning ticket not found');
        }
      }
      return internalError(c);
    }
  },
);

route.put(
  '/@me',
  requireRole('user', 'admin'),
  zValidator('json', updateUserSchema, (result, c) => {
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
      const userJwtClaim = c.get('jwtPayload') as { userId: number };
      const id = userJwtClaim.userId;
      const body = c.req.valid('json');
      const existedUser = await userService.getById(id);
      if (!existedUser) {
        return c.json({
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            detail: `User id ${id} is not found`,
          },
        });
      }

      const updatedUser = await userService.updateById(id, body);

      return c.json({
        data: updatedUser,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Get user by id
route.get(
  '/:id',
  requireRole('admin'),
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
              detail: 'ID is not number',
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
      const user = await userService.getById(id);
      if (!user) {
        return c.json(
          {
            error: {
              status: 404,
              code: 'USER_NOT_FOUND',
              detail: `User id ${id} is not found.`,
            },
          },
          404,
        );
      }

      return c.json({
        data: user,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Update user by id
route.put(
  '/:id',
  requireRole('admin'),
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
              detail: 'ID is not number',
            },
          },
          400,
        );
      }
    },
  ),
  zValidator('json', updateUserForAdminSchema, (result, c) => {
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
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const existedUser = await userService.getById(id);
      if (!existedUser) {
        return c.json({
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            detail: `User id ${id} is not found`,
          },
        });
      }

      const updatedUser = await userService.updateById(id, body);

      return c.json({
        data: updatedUser,
      });
    } catch {
      return internalError(c);
    }
  },
);

// Delete user by id
route.delete(
  '/:id',
  requireRole('admin'),
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
              detail: 'ID is not number',
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
      const existedUser = await userService.getById(id);

      if (!existedUser) {
        return c.json(
          {
            error: {
              status: 404,
              code: 'USER_NOT_FOUND',
              detail: `User id ${id} is not found`,
            },
          },
          404,
        );
      }

      await userService.deleteById(id);
      return c.body(null, 204);
    } catch {
      return internalError(c);
    }
  },
);

export default route;
