import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").unique(),
  username: text("username").unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Notes table
export const notes = sqliteTable("notes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  itemId: text("itemId").notNull().unique(),
  userId: integer("userId").references(() => users.id),
  title: text("title").notNull(),
  type: text("type", { enum: ["folder", "document"] }).default("document").notNull(),
  module: text("module", { enum: ["general", "academic", "novel"] }).default("general").notNull(),
  content: text("content"),
  synopsis: text("synopsis"),
  status: text("status"),
  tags: text("tags").default("[]"),
  linkedNoteIds: text("linkedNoteIds").default("[]"),
  children: text("children").default("[]"),
  parentId: text("parentId"),
  snapshots: text("snapshots").default("[]"),
  wordCountTarget: integer("wordCountTarget").default(0),
  x: integer("x").default(0),
  y: integer("y").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// Recipes table
export const recipes = sqliteTable("recipes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  recipeId: text("recipeId").notNull().unique(),
  userId: integer("userId").references(() => users.id),
  name: text("name").notNull(),
  ingredients: text("ingredients").default("[]"),
  steps: text("steps").default("[]"),
  cookTime: integer("cookTime").default(0),
  method: text("method").default(""),
  taste: text("taste").default(""),
  tags: text("tags").default("[]"),
  linkedRecipeIds: text("linkedRecipeIds").default("[]"),
  note: text("note").default(""),
  linkUrl: text("linkUrl").default(""),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

// Desktop Items
export const desktopItems = sqliteTable("desktop_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id),
  itemId: text("itemId").notNull(),
  name: text("name").notNull(),
  itemType: text("itemType").default("text"),
  icon: text("icon").default("file-text"),
  content: text("content"),
  x: integer("x").default(0),
  y: integer("y").default(0),
  source: text("source").default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type DesktopItem = typeof desktopItems.$inferSelect;
export type InsertDesktopItem = typeof desktopItems.$inferInsert;

// Editor Settings
export const editorSettings = sqliteTable("editor_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id),
  fontFamily: text("fontFamily").default('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'),
  fontSize: integer("fontSize").default(14),
  textColor: text("textColor").default("#d4d4d4"),
  bgColor: text("bgColor").default("#252525"),
  bgImage: text("bgImage"),
  bgImageOpacity: integer("bgImageOpacity").default(30),
  bgImageMode: text("bgImageMode").default("cover"),
  lineHeight: integer("lineHeight").default(18),
  letterSpacing: integer("letterSpacing").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type EditorSetting = typeof editorSettings.$inferSelect;
export type InsertEditorSetting = typeof editorSettings.$inferInsert;
