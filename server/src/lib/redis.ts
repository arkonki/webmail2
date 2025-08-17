import IORedis from 'ioredis';
import config from '../config';

const connection = config.REDIS_SOCKET_PATH ?? config.REDIS_URL;

if (!connection) {
    throw new Error('Redis configuration is missing. Please set either REDIS_URL or REDIS_SOCKET_PATH in your .env file.');
}

const redis = new IORedis(connection, {
  maxRetriesPerRequest: null, // Important for BullMQ
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;