import express from 'express';
import { config } from './config.js';
import { errorHandler, fail } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { reportRoutes } from './routes/reports.js';
import { incidentRoutes } from './routes/incidents.js';
import { advisoryRoutes } from './routes/advisories.js';
import { assistanceRoutes } from './routes/assistance.js';
import { distributionRoutes } from './routes/distribution.js';
import { settingsRoutes } from './routes/settings.js';
import { guidanceRoutes } from './routes/guidance.js';
import { analyticsRoutes } from './routes/analytics.js';
import { attachmentRoutes } from './routes/attachments.js';
const requests = new Map<string, { count: number; until: number }>();
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    });
    if (req.get('origin') === config.webOrigin)
      res.set({
        'Access-Control-Allow-Origin': config.webOrigin,
        'Access-Control-Allow-Credentials': 'true',
        Vary: 'Origin',
      });
    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-CSRF-Token,Idempotency-Key',
        'Access-Control-Max-Age': '600',
      });
      res.sendStatus(204);
      return;
    }
    const key = req.ip ?? 'unknown',
      time = Date.now();
    let bucket = requests.get(key);
    if (!bucket || bucket.until < time) {
      bucket = { count: 0, until: time + 60000 };
      requests.set(key, bucket);
    }
    if (++bucket.count > 1500) {
      res
        .status(429)
        .json({ error: { code: 'rate_limit', message: 'Too many requests; retry shortly' } });
      return;
    }
    if (requests.size > 10000)
      for (const [id, value] of requests) if (value.until < time) requests.delete(id);
    next();
  });
  app.use(express.json({ limit: '128kb', strict: true }));
  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  authRoutes(app);
  reportRoutes(app);
  incidentRoutes(app);
  advisoryRoutes(app);
  assistanceRoutes(app);
  distributionRoutes(app);
  settingsRoutes(app);
  guidanceRoutes(app);
  analyticsRoutes(app);
  attachmentRoutes(app);
  app.use((_req, _res, next) => {
    try {
      fail(404, 'Endpoint not found', 'not_found');
    } catch (error) {
      next(error);
    }
  });
  app.use(errorHandler);
  return app;
}
