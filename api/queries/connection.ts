import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

let pool: Pool | null = null;
let instance: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!instance) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
      idleTimeoutMillis: 30000,
    });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

export function closeDb() {
  if (pool) {
    pool.end();
    pool = null;
    instance = undefined as any;
  }
}
