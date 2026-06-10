import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { editorSettings } from "@db/schema";

export const settingRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(editorSettings)
      .where(eq(editorSettings.userId, ctx.user.id));
    return rows[0] || null;
  }),

  save: authedQuery
    .input(z.object({
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      textColor: z.string().optional(),
      bgColor: z.string().optional(),
      bgImage: z.string().nullable().optional(),
      bgImageOpacity: z.number().optional(),
      bgImageMode: z.string().optional(),
      lineHeight: z.number().optional(),
      letterSpacing: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(editorSettings)
        .where(eq(editorSettings.userId, ctx.user.id));

      if (existing.length === 0) {
        await db.insert(editorSettings).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        await db
          .update(editorSettings)
          .set(input)
          .where(eq(editorSettings.userId, ctx.user.id));
      }
      return { success: true };
    }),
});
