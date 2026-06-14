import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@db/schema";
import { env } from "../lib/env";

let client: ReturnType<typeof createClient> | null = null;
let instance: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!instance) {
    const dbUrl = env.databaseUrl;
    // For file-based SQLite (local dev or Render with persistent disk)
    if (dbUrl.startsWith("file:")) {
      client = createClient({ url: dbUrl });
    } else if (dbUrl.includes("turso.io") || dbUrl.includes("libsql")) {
      // For Turso/libsql remote
      client = createClient({ url: dbUrl });
    } else {
      // Default to local file
      client = createClient({ url: `file:${dbUrl}` });
    }
    instance = drizzle(client, { schema });
  }
  return instance;
}

/** Close database connection - call on shutdown */
export function closeDb() {
  if (client) {
    client.close();
    client = null;
    instance = undefined as any;
  }
}
