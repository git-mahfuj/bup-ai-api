import "dotenv/config";

type RedisConfigType = {
  REDIS_USERNAME: string;
  REDIS_PASS: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
};

export const redisConfig: RedisConfigType = {
  REDIS_USERNAME: process.env.REDIS_USERNAME!,
  REDIS_PASS: process.env.REDIS_PASSWORD!,
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: Number(process.env.REDIS_PORT)!,
};
