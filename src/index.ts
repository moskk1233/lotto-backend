import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import userRoute from './routes/users.js';
import authRoute from './routes/auth.js';

const app = new Hono();

app.use(logger());
app.use(
  cors({
    origin: '*',
    allowHeaders: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAge: 600,
  }),
);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/users', userRoute);
app.route('/auth', authRoute);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
