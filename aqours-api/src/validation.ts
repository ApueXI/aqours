import { z } from 'zod';
import type { DB } from './db.js';
import { get } from './store.js';
import { fail } from './errors.js';
export const id = z.uuid();
export const text = z.string().trim().min(1).max(5000);
export const short = z.string().trim().min(1).max(250);
export const instant = z.iso.datetime({ offset: true }).transform((v) => new Date(v).toISOString());
export const category = z.enum(['outage', 'low_pressure', 'leak', 'water_quality']);
export const assistanceType = z.enum(['callback', 'inspection', 'water_support']);
export const liters = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/)
  .refine(
    (v) => Number(v) > 0 && Number(v) <= 1e9,
    'Liters must be positive and at most 1 billion',
  );
export const totalLiters = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/)
  .refine((v) => Number(v) <= 1e9);
export const expected = z.number().int().positive();
export const kind = z.enum([
  'scheduled_interruption',
  'boil_water',
  'do_not_drink',
  'do_not_use',
  'general',
]);
const position = z
  .array(z.number().finite())
  .length(2)
  .refine((v) => Math.abs(v[0]!) <= 180 && Math.abs(v[1]!) <= 90);
const ring = z
  .array(position)
  .min(4)
  .max(2000)
  .refine((v) => JSON.stringify(v[0]) === JSON.stringify(v.at(-1)), 'Ring must close');
export const geometry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: z.array(ring).min(1).max(20) }).strict(),
  z
    .object({
      type: z.literal('MultiPolygon'),
      coordinates: z.array(z.array(ring).min(1).max(20)).min(1).max(20),
    })
    .strict(),
]);
export function coordinates(data: Record<string, any>) {
  const lat = data.latitude ?? null,
    lon = data.longitude ?? null;
  if ((lat === null) !== (lon === null)) fail(400, 'Coordinates must be paired');
  if (
    lat !== null &&
    (typeof lat !== 'number' ||
      !Number.isFinite(lat) ||
      Math.abs(lat) > 90 ||
      typeof lon !== 'number' ||
      !Number.isFinite(lon) ||
      Math.abs(lon) > 180)
  )
    fail(400, 'Invalid coordinate range');
}
export async function zones(db: DB, values: string[], active = true) {
  if (!values.length || new Set(values).size !== values.length)
    fail(400, 'Choose distinct service zones');
  for (const value of [...values].sort()) {
    const zone = await get(db, 'zone', value, true);
    if (active && !zone.active) fail(400, 'Zone is inactive');
  }
}
export async function staffOwner(db: DB, value: string | null | undefined, required = false) {
  if (!value) {
    if (required) fail(400, 'Assign an active staff owner');
    return;
  }
  const user = await get(db, 'user', value);
  if (!user.active || user.role === 'customer') fail(400, 'Owner must be active staff');
}
export function interval(startsAt: string, endsAt: string) {
  if (new Date(startsAt) >= new Date(endsAt)) fail(400, 'End must be after start');
}
