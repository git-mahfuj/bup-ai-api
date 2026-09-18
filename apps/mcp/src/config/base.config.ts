import "dotenv/config";

type BaseConfigType = {
  MONGO_URI: string;
  PORT: number;
  VOYAGE_API_KEY: string;
  PG_DATABASE_URI: string;
  NODE_ENV: string;
};

export const baseConfig: BaseConfigType = {
  MONGO_URI: process.env.MONGO_URI!,
  PORT: Number(process.env.PORT),
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY!,
  PG_DATABASE_URI: process.env.PG_DATABASE_URI!,
  NODE_ENV: process.env.NODE_ENV!,
};
