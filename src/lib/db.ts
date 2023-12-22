import { Redis, RedisConfigNodejs } from '@upstash/redis';

interface RedisConfig extends RedisConfigNodejs {
  // You can add additional properties here if needed
}

const redisConfig: RedisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || '', // Ensure it's not undefined
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '', // Ensure it's not undefined
};

export const db = new Redis(redisConfig);
