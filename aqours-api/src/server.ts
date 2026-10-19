import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
const server = createApp().listen(config.port, '0.0.0.0', () =>
  console.log(`Aqours API listening on port ${config.port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () =>
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    }),
  );
