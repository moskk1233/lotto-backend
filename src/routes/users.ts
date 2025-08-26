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

const route = new Hono();
const userService = UserService.getInstance();

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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
      const offset = (page - 1) * limit;
      const userCount = await userService.count();
      const pageCount = Math.ceil(userCount / limit);

      const where: Prisma.UsersWhereInput = {};

      if (status) where.status = status;

      const users = await userService.getAll(limit, offset, where);
      return c.json({
        data: users,
        meta: {
          page,
          pageCount,
        },
      });
    } catch {
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
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
      return c.json(
        {
          error: {
            status: 500,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'Something went wrong please try again',
          },
        },
        500,
      );
    }
  },
);

export default route;
