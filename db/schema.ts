import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ Notes / Binder Items ============
export const notes = mysqlTable("notes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["folder", "document"]).default("document").notNull(),
  module: mysqlEnum("module", ["general", "academic", "novel"]).default("general").notNull(),
  content: text("content").default(""),
  synopsis: text("synopsis").default(""),
  status: varchar("status", { length: 20 }).default("待写"),
  tags: text("tags").default("[]"),
  linkedNoteIds: text("linkedNoteIds").default("[]"),
  children: text("children").default("[]"),
  parentId: varchar("parentId", { length: 64 }).default(""),
  snapshots: text("snapshots").default("[]"),
  wordCountTarget: bigint("wordCountTarget", { mode: "number", unsigned: true }).default(0),
  x: bigint("x", { mode: "number" }).default(0),
  y: bigint("y", { mode: "number" }).default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// ============ Cookbook Recipes ============
export const recipes = mysqlTable("recipes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  recipeId: varchar("recipeId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ingredients: text("ingredients").default("[]"),
  steps: text("steps").default("[]"),
  cookTime: bigint("cookTime", { mode: "number", unsigned: true }).default(15),
  method: varchar("method", { length: 20 }).default("炒"),
  taste: varchar("taste", { length: 20 }).default("咸鲜"),
  tags: text("tags").default("[]"),
  linkedRecipeIds: text("linkedRecipeIds").default("[]"),
  note: text("note").default(""),
  linkUrl: varchar("linkUrl", { length: 512 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

// ============ Desktop Items ============
export const desktopItems = mysqlTable("desktop_items", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  itemType: varchar("itemType", { length: 20 }).default("text"),
  icon: varchar("icon", { length: 50 }).default("file-text"),
  content: text("content").default(""),
  x: bigint("x", { mode: "number" }).default(0),
  y: bigint("y", { mode: "number" }).default(0),
  source: varchar("source", { length: 20 }).default("user"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type DesktopItem = typeof desktopItems.$inferSelect;
export type InsertDesktopItem = typeof desktopItems.$inferInsert;

// ============ Editor Settings ============
export const editorSettings = mysqlTable("editor_settings", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  fontFamily: varchar("fontFamily", { length: 255 }).default('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'),
  fontSize: bigint("fontSize", { mode: "number", unsigned: true }).default(14),
  textColor: varchar("textColor", { length: 20 }).default("#d4d4d4"),
  bgColor: varchar("bgColor", { length: 20 }).default("#252525"),
  bgImage: text("bgImage").default(""),
  bgImageOpacity: bigint("bgImageOpacity", { mode: "number", unsigned: true }).default(30),
  bgImageMode: varchar("bgImageMode", { length: 20 }).default("cover"),
  lineHeight: bigint("lineHeight", { mode: "number" }).default(18),
  letterSpacing: bigint("letterSpacing", { mode: "number" }).default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type EditorSetting = typeof editorSettings.$inferSelect;
export type InsertEditorSetting = typeof editorSettings.$inferInsert;
