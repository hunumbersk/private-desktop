import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Runtime DB sync: try to push schema on startup with retry
  if (env.databaseUrl) {
    (async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`[DB] Attempting schema sync (try ${attempt}/5)...`);
          const { execSync } = await import("child_process");
          execSync("npx drizzle-kit push --force", {
            stdio: "inherit",
            timeout: 60000,
          });
          console.log("[DB] Schema sync complete.");
          break;
        } catch (e: any) {
          console.error(`[DB] Sync attempt ${attempt} failed:`, e?.message || e);
          if (attempt < 5) {
            const waitMs = attempt * 3000;
            console.log(`[DB] Retrying in ${waitMs}ms...`);
            await new Promise((r) => setTimeout(r, waitMs));
          } else {
            console.error("[DB] All sync attempts failed. Tables may need manual creation.");
          }
        }
      }
    })();
  }
}
