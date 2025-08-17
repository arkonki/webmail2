import IORedis from 'ioredis';
import config from '../config';

const redis = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Important for BullMQ
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
