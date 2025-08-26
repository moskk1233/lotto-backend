import { createClientPool } from 'redis';

const redis = createClientPool();

redis.on('error', (err) => console.log('Redis client connection error:', err));

export default redis;
