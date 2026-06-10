import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { notes } from "@db/schema";

export const noteRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, ctx.user.id));
    return rows;
  }),

  create: authedQuery
    .input(z.object({
      itemId: z.string().min(1),
      title: z.string().min(1),
      type: z.enum(["folder", "document"]).default("document"),
      module: z.enum(["general", "academic", "novel"]).default("general"),
      content: z.string().default(""),
      synopsis: z.string().default(""),
      status: z.string().default("待写"),
      tags: z.string().default("[]"),
      linkedNoteIds: z.string().default("[]"),
      children: z.string().default("[]"),
      parentId: z.string().nullable().default(null),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(notes).values({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  update: authedQuery
    .input(z.object({
      itemId: z.string().min(1),
      title: z.string().optional(),
      content: z.string().optional(),
      synopsis: z.string().optional(),
      status: z.string().optional(),
      tags: z.string().optional(),
      linkedNoteIds: z.string().optional(),
      children: z.string().optional(),
      parentId: z.string().nullable().optional(),
      snapshots: z.string().optional(),
      wordCountTarget: z.number().optional(),
      module: z.enum(["general", "academic", "novel"]).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { itemId, ...data } = input;
      await db
        .update(notes)
        .set(data)
        .where(and(eq(notes.userId, ctx.user.id), eq(notes.itemId, itemId)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ itemId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(notes)
        .where(and(eq(notes.userId, ctx.user.id), eq(notes.itemId, input.itemId)));
      return { success: true };
    }),

  sync: authedQuery
    .input(z.array(z.object({
      itemId: z.string(),
      title: z.string(),
      type: z.enum(["folder", "document"]),
      module: z.enum(["general", "academic", "novel"]),
      content: z.string(),
      synopsis: z.string(),
      status: z.string(),
      tags: z.string(),
      linkedNoteIds: z.string(),
      children: z.string(),
      parentId: z.string().nullable(),
      snapshots: z.string(),
      wordCountTarget: z.number(),
      x: z.number().nullable(),
      y: z.number().nullable(),
    })))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Delete existing notes for this user
      await db.delete(notes).where(eq(notes.userId, ctx.user.id));
      // Insert all new notes
      if (input.length > 0) {
        await db.insert(notes).values(input.map(n => ({
          userId: ctx.user.id,
          ...n,
        })));
      }
      return { success: true, count: input.length };
    }),
});
