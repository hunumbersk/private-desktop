import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";

export async function findUserByUsername(username: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function createLocalUser(data: {
  username: string;
  passwordHash: string;
  name: string;
}) {
  const values: InsertUser = {
    unionId: `local:${data.username}`,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    role: "user",
    lastSignInAt: new Date(),
  };
  const result = await getDb()
    .insert(schema.users)
    .values(values);
  return result;
}

export async function updateLastSignIn(userId: number) {
  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, userId));
}
