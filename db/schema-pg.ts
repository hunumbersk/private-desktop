import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const typeEnum = pgEnum("type", ["folder", "document"]);
export const moduleEnum = pgEnum("module", ["general", "academic", "novel"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ Notes / Binder Items ============
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: typeEnum("type").default("document").notNull(),
  module: moduleEnum("module").default("general").notNull(),
  content: text("content"),
  synopsis: text("synopsis"),
  status: varchar("status", { length: 20 }).default("待写"),
  tags: text("tags"),
  linkedNoteIds: text("linkedNoteIds"),
  children: text("children"),
  parentId: varchar("parentId", { length: 64 }),
  snapshots: text("snapshots"),
  wordCountTarget: integer("wordCountTarget").default(0),
  x: integer("x").default(0),
  y: integer("y").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// ============ Cookbook Recipes ============
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeId: varchar("recipeId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ingredients: text("ingredients"),
  steps: text("steps"),
  cookTime: integer("cookTime").default(15),
  method: varchar("method", { length: 20 }).default("炒"),
  taste: varchar("taste", { length: 20 }).default("咸鲜"),
  tags: text("tags"),
  linkedRecipeIds: text("linkedRecipeIds"),
  note: text("note"),
  linkUrl: varchar("linkUrl", { length: 512 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

// ============ Desktop Items ============
export const desktopItems = pgTable("desktop_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  itemType: varchar("itemType", { length: 20 }).default("text"),
  icon: varchar("icon", { length: 50 }).default("file-text"),
  content: text("content"),
  x: integer("x").default(0),
  y: integer("y").default(0),
  source: varchar("source", { length: 20 }).default("user"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type DesktopItem = typeof desktopItems.$inferSelect;
export type InsertDesktopItem = typeof desktopItems.$inferInsert;

// ============ Editor Settings ============
export const editorSettings = pgTable("editor_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fontFamily: varchar("fontFamily", { length: 255 }).default('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'),
  fontSize: integer("fontSize").default(14),
  textColor: varchar("textColor", { length: 20 }).default("#d4d4d4"),
  bgColor: varchar("bgColor", { length: 20 }).default("#252525"),
  bgImage: text("bgImage"),
  bgImageOpacity: integer("bgImageOpacity").default(30),
  bgImageMode: varchar("bgImageMode", { length: 20 }).default("cover"),
  lineHeight: integer("lineHeight").default(18),
  letterSpacing: integer("letterSpacing").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type EditorSetting = typeof editorSettings.$inferSelect;
export type InsertEditorSetting = typeof editorSettings.$inferInsert;
