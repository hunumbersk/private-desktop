import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@db/schema";
import { env } from "../lib/env";
import fs from "fs";
import path from "path";

let client: ReturnType<typeof createClient> | null = null;
let instance: ReturnType<typeof drizzle<typeof schema>>;

function ensureDataDir(dbUrl: string) {
  if (dbUrl.startsWith("file:")) {
    const filePath = dbUrl.slice(5); // remove "file:" prefix
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    }
  }
}

export function getDb() {
  if (!instance) {
    const dbUrl = env.databaseUrl;
    ensureDataDir(dbUrl);
    client = createClient({ url: dbUrl });
    instance = drizzle(client, { schema });
  }
  return instance;
}

/** Auto-create tables on first startup */
export async function initDatabase() {
  try {
    // Ensure client is initialized
    const db = getDb();
    // Use raw SQL through the libsql client directly
    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unionId TEXT UNIQUE,
        username TEXT UNIQUE,
        passwordHash TEXT,
        name TEXT,
        email TEXT,
        avatar TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt INTEGER DEFAULT (unixepoch()),
        updatedAt INTEGER DEFAULT (unixepoch()),
        lastSignInAt INTEGER DEFAULT (unixepoch())
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemId TEXT NOT NULL UNIQUE,
        userId INTEGER,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'document',
        module TEXT NOT NULL DEFAULT 'general',
        content TEXT,
        synopsis TEXT,
        status TEXT,
        tags TEXT DEFAULT '[]',
        linkedNoteIds TEXT DEFAULT '[]',
        children TEXT DEFAULT '[]',
        parentId TEXT,
        snapshots TEXT DEFAULT '[]',
        wordCountTarget INTEGER DEFAULT 0,
        x INTEGER DEFAULT 0,
        y INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (unixepoch()),
        updatedAt INTEGER DEFAULT (unixepoch())
      )`,
      `CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipeId TEXT NOT NULL UNIQUE,
        userId INTEGER,
        name TEXT NOT NULL,
        ingredients TEXT DEFAULT '[]',
        steps TEXT DEFAULT '[]',
        cookTime INTEGER DEFAULT 15,
        method TEXT DEFAULT '',
        taste TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        linkedRecipeIds TEXT DEFAULT '[]',
        note TEXT DEFAULT '',
        linkUrl TEXT DEFAULT '',
        createdAt INTEGER DEFAULT (unixepoch()),
        updatedAt INTEGER DEFAULT (unixepoch())
      )`,
      `CREATE TABLE IF NOT EXISTS desktop_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        itemId TEXT NOT NULL,
        name TEXT NOT NULL,
        itemType TEXT DEFAULT 'text',
        icon TEXT DEFAULT 'file-text',
        content TEXT,
        x INTEGER DEFAULT 0,
        y INTEGER DEFAULT 0,
        source TEXT DEFAULT 'user',
        createdAt INTEGER DEFAULT (unixepoch()),
        updatedAt INTEGER DEFAULT (unixepoch())
      )`,
      `CREATE TABLE IF NOT EXISTS editor_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        fontFamily TEXT DEFAULT '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize INTEGER DEFAULT 14,
        textColor TEXT DEFAULT '#d4d4d4',
        bgColor TEXT DEFAULT '#252525',
        bgImage TEXT,
        bgImageOpacity INTEGER DEFAULT 30,
        bgImageMode TEXT DEFAULT 'cover',
        lineHeight INTEGER DEFAULT 18,
        letterSpacing INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (unixepoch()),
        updatedAt INTEGER DEFAULT (unixepoch())
      )`,
    ];
    for (const sql of sqlStatements) {
      await (client as any).execute(sql);
    }
    console.log('[DB] All tables initialized successfully');
  } catch (err: any) {
    console.error('[DB] Init error:', err?.message || err);
    // Don't throw - let the app start anyway
  }
}

/** Close database connection - call on shutdown */
export function closeDb() {
  if (client) {
    client.close();
    client = null;
    instance = undefined as any;
  }
}
