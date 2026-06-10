import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { desktopItems } from "@db/schema";

export const desktopRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(desktopItems).where(eq(desktopItems.userId, ctx.user.id));
  }),

  sync: authedQuery
    .input(z.array(z.object({
      itemId: z.string(),
      name: z.string(),
      itemType: z.string(),
      icon: z.string(),
      content: z.string(),
      x: z.number(),
      y: z.number(),
      source: z.string(),
    })))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(desktopItems).where(eq(desktopItems.userId, ctx.user.id));
      if (input.length > 0) {
        await db.insert(desktopItems).values(input.map(i => ({ userId: ctx.user.id, ...i })));
      }
      return { success: true, count: input.length };
    }),
});
