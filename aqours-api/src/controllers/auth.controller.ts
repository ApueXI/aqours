import type { RequestHandler } from "express";
import { config } from "../config/environment.js";
import { origin, presented } from "../middleware/authentication.js";
import {
  currentSession,
  signIn,
  signOut,
} from "../services/auth/authentication.service.js";
import { fail } from "../utils/errors.js";
import { loginInput } from "../validators/authentication.js";

const attempts = new Map<string, { count: number; until: number }>();
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.production,
  path: "/api/v1",
});
export const login: RequestHandler = async (req, res, next) => {
  try {
    const key = req.ip ?? "unknown",
      time = Date.now();
    let bucket = attempts.get(key);
    if (!bucket || bucket.until < time) {
      bucket = { count: 0, until: time + 60000 };
      attempts.set(key, bucket);
    }
    if (++bucket.count > 12)
      fail(429, "Too many login attempts; try again shortly", "rate_limit");
    const input = loginInput.parse(req.body);
    if (input.client === "web") origin(req);
    const result = await signIn(input);
    if (input.client === "web")
      res.cookie("aqours_session", result.token, {
        ...cookieOptions(),
        maxAge: config.sessionDays * 86400000,
      });
    res.json({
      data: {
        user: result.user,
        ...(input.client === "web"
          ? { csrfToken: result.csrfToken }
          : { token: result.token }),
      },
    });
  } catch (error) {
    next(error);
  }
};
export const logout: RequestHandler = async (req, res, next) => {
  try {
    const credentials = presented(req);
    if (credentials?.client !== "mobile") origin(req);
    if (credentials?.client === "web") {
      const session = await currentSession(credentials.token);
      if (session && req.get("x-csrf-token") !== session.csrf)
        fail(403, "CSRF verification failed", "csrf");
    }
    if (credentials) await signOut(credentials.token);
    res.clearCookie("aqours_session", cookieOptions());
    res.json({ data: { loggedOut: true } });
  } catch (error) {
    next(error);
  }
};
