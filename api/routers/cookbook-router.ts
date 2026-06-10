import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { recipes } from "@db/schema";

export const cookbookRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(recipes).where(eq(recipes.userId, ctx.user.id));
  }),

  sync: authedQuery
    .input(z.array(z.object({
      recipeId: z.string(),
      name: z.string(),
      ingredients: z.string(),
      steps: z.string(),
      cookTime: z.number(),
      method: z.string(),
      taste: z.string(),
      tags: z.string(),
      linkedRecipeIds: z.string(),
      note: z.string(),
      linkUrl: z.string(),
    })))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(recipes).where(eq(recipes.userId, ctx.user.id));
      if (input.length > 0) {
        await db.insert(recipes).values(input.map(r => ({ userId: ctx.user.id, ...r })));
      }
      return { success: true, count: input.length };
    }),

  create: authedQuery
    .input(z.object({
      recipeId: z.string(),
      name: z.string(),
      ingredients: z.string().default("[]"),
      steps: z.string().default("[]"),
      cookTime: z.number().default(15),
      method: z.string().default("炒"),
      taste: z.string().default("咸鲜"),
      tags: z.string().default("[]"),
      linkedRecipeIds: z.string().default("[]"),
      note: z.string().default(""),
      linkUrl: z.string().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(recipes).values({ userId: ctx.user.id, ...input });
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ recipeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(recipes).where(and(eq(recipes.userId, ctx.user.id), eq(recipes.recipeId, input.recipeId)));
      return { success: true };
    }),
});
