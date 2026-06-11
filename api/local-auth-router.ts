import { z } from "zod";
import bcrypt from "bcryptjs";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { findUserByUsername, createLocalUser, updateLastSignIn } from "./queries/local-users";
import { env } from "./lib/env";

export const localAuthRouter = createRouter({
  /** Register a new local account */
  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(32),
        password: z.string().min(6).max(64),
        name: z.string().min(1).max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if username already exists
      const existing = await findUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "用户名已被注册",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);
      const displayName = input.name || input.username;

      // Create user
      await createLocalUser({
        username: input.username,
        passwordHash,
        name: displayName,
      });

      return { success: true, message: "注册成功" };
    }),

  /** Login with username/password */
  login: publicQuery
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find user by username
      const user = await findUserByUsername(input.username);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "用户名或密码错误",
        });
      }

      // Verify password
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "用户名或密码错误",
        });
      }

      // Update last sign in
      await updateLastSignIn(user.id);

      // Generate session token
      const token = await signSessionToken({
        unionId: `local:${input.username}`,
        clientId: env.appId,
      });

      // Set session cookie
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...cookieOpts,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      };
    }),

  /** Check if a username is available */
  checkUsername: publicQuery
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const existing = await findUserByUsername(input.username);
      return { available: !existing };
    }),
});
