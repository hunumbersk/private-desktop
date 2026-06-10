import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { noteRouter } from "./routers/note-router";
import { cookbookRouter } from "./routers/cookbook-router";
import { desktopRouter } from "./routers/desktop-router";
import { settingRouter } from "./routers/setting-router";

export const appRouter = createRouter({
  health: publicQuery.query(() => "ok"),
  auth: authRouter,
  localAuth: localAuthRouter,
  note: noteRouter,
  cookbook: cookbookRouter,
  desktop: desktopRouter,
  setting: settingRouter,
});

export type AppRouter = typeof appRouter;
