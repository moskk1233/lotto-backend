import { createClientPool } from 'redis';

const redis = createClientPool(
  {
    url: process.env.REDIS_URL!,
  },
  {
    minimum: 1,
    maximum: 5,
  },
);

redis.on('error', (err) => console.log('Redis client connection error:', err));

export default redis;
