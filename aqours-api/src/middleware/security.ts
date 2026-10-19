import type { RequestHandler } from "express";
import { config } from "../config/environment.js";
const requests = new Map<string, { count: number; until: number }>();
export const securityHeadersAndRateLimit: RequestHandler = (req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  });
  if (req.get("origin") === config.webOrigin)
    res.set({
      "Access-Control-Allow-Origin": config.webOrigin,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    });
  if (req.method === "OPTIONS") {
    res.set({
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,Authorization,X-CSRF-Token,Idempotency-Key",
      "Access-Control-Max-Age": "600",
    });
    res.sendStatus(204);
    return;
  }
  const key = req.ip ?? "unknown",
    time = Date.now();
  let bucket = requests.get(key);
  if (!bucket || bucket.until < time) {
    bucket = { count: 0, until: time + 60000 };
    requests.set(key, bucket);
  }
  if (++bucket.count > 1500) {
    res.status(429).json({
      error: {
        code: "rate_limit",
        message: "Too many requests; retry shortly",
      },
    });
    return;
  }
  if (requests.size > 10000)
    for (const [id, value] of requests)
      if (value.until < time) requests.delete(id);
  next();
};
