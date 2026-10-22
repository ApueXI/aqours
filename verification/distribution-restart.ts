import assert from 'node:assert/strict';
import { disconnect, transaction } from '../aqours-api/src/config/database.ts';
import { siteForecast } from '../aqours-api/src/services/monitoring/forecast.ts';

assert.ok(process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test'));
globalThis.fetch = async () => { throw new Error('Restart probe must read persisted data without provider access'); };
try {
  const forecast = await transaction(db => siteForecast(db, process.argv[2]!));
  process.stdout.write(JSON.stringify(forecast));
} finally { await disconnect(); }
