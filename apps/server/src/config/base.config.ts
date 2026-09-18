import "dotenv/config";
export type BaseConfigType = {
  PORT: number;
  DATABASE_URL: string;
  NODE_ENV: string;
};

export const baseConfig: BaseConfigType = {
  DATABASE_URL: String(process.env.DATABASE_URL),
  PORT: Number(process.env.PORT) ?? 5000,
  NODE_ENV: String(process.env.NODE_ENV),
};
