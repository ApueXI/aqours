import { z } from "zod";
import { id } from "./common.js";

const coordinate = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform(Number)
    .pipe(z.number().finite().min(-maximum).max(maximum));
export const weatherQuery = z.union([
  z.object({ connectionId: id }).strict(),
  z.object({ latitude: coordinate(90), longitude: coordinate(180) }).strict(),
]);
export const weatherSearchQuery = z
  .object({ q: z.string().trim().min(2).max(100) })
  .strict();
