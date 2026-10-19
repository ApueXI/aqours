import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class Fault extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, message: string, code = 'validation'): never {
  throw new Fault(status, code, message);
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({ error: { code: 'validation', message: 'Invalid request', details: error.issues } });
    return;
  }
  if (error instanceof Fault) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  const code = error?.code;
  if (code === '23505') {
    res
      .status(409)
      .json({ error: { code: 'conflict', message: 'A conflicting record already exists' } });
    return;
  }
  if (code === 'LIMIT_FILE_SIZE' || error?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'size', message: 'Maximum upload size is 5 MiB' } });
    return;
  }
  if (error?.status === 400 || code === '22P02' || code === '23514' || code === '23503') {
    res.status(400).json({ error: { code: 'validation', message: 'Invalid request data' } });
    return;
  }
  console.error('API request failed', { code: typeof code === 'string' ? code : 'internal' });
  res.status(500).json({ error: { code: 'internal', message: 'Request could not be completed' } });
};
