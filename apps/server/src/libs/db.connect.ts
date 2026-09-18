import { baseConfig } from "@/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "@/database/relations";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export const pgDb = drizzle(baseConfig.DATABASE_URL, {
  relations,
  logger: baseConfig.NODE_ENV !== "production",
  jit: true,
});

type RelationsType = typeof relations;
type Transaction = Parameters<Parameters<typeof pgDb.transaction>[0]>[0];

export type PgDbClientType = NodePgDatabase<RelationsType> | Transaction;
