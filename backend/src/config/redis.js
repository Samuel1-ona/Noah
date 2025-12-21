import { createClient } from 'redis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    const redisConfig = config.redis.url
      ? { url: config.redis.url }
      : {
          socket: {
            host: config.redis.host,
            port: config.redis.port,
          },
        };

    redisClient = createClient(redisConfig);

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
  }

  return redisClient;
};

// Cache helpers
export const cache = {
  get: async (key) => {
    try {
      const client = await getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  },

  set: async (key, value, ttl = 3600) => {
    try {
      const client = await getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
    }
  },

  del: async (key) => {
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
    }
  },
};

// Message queue helpers
export const queue = {
  push: async (queueName, message) => {
    try {
      const client = await getRedisClient();
      await client.lPush(queueName, JSON.stringify(message));
    } catch (error) {
      logger.error('Queue push error', { queueName, error: error.message });
    }
  },

  pop: async (queueName) => {
    try {
      const client = await getRedisClient();
      const message = await client.rPop(queueName);
      return message ? JSON.parse(message) : null;
    } catch (error) {
      logger.error('Queue pop error', { queueName, error: error.message });
      return null;
    }
  },
};

