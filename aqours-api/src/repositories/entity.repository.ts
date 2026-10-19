import type { DB } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import type { Doc } from "../types/domain.js";
import { fail } from "../utils/errors.js";
import { decode, encode, nestedData } from "./serialization.js";

export interface Delegate {
  findUnique(args: any): Promise<any>;
  findMany(args: any): Promise<any[]>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
}
export interface EntityConfig {
  kind: string;
  table: string;
  fields: Record<string, string>;
  junctions: string[];
  include: Record<string, boolean>;
  owned: boolean;
}

/** Shared mechanics; each domain repository supplies a generated Prisma model delegate. */
export function makeRepository(
  db: DB,
  delegate: Delegate,
  config: EntityConfig,
) {
  const include = Object.keys(config.include).length
    ? config.include
    : undefined;
  return {
    async get(id: string, lock = false): Promise<Doc> {
      if (lock)
        await db.$queryRaw(
          Prisma.sql`SELECT id FROM ${Prisma.raw(config.table)} WHERE id=${id}::uuid FOR UPDATE`,
        );
      const row = await delegate.findUnique({ where: { id }, include });
      if (!row) fail(404, "Record not found", "not_found");
      return decode(row, config);
    },
    async all(owner?: string): Promise<Doc[]> {
      const rows = await delegate.findMany({
        where: owner && config.owned ? { customerId: owner } : {},
        orderBy: [{ storedAt: "desc" }, { id: "asc" }],
        include,
      });
      return rows.map((row) => decode(row, config));
    },
    async create(id: string, input: Record<string, any>): Promise<Doc> {
      await db.entity.create({ data: { id, kind: config.kind } });
      const row = await delegate.create({
        data: {
          id,
          version: input.version ?? 1,
          ...encode(input, config),
          ...nestedData(input, config),
        },
        include,
      });
      return decode(row, config);
    },
    async save(doc: Doc): Promise<Doc> {
      const result = await delegate.updateMany({
        where: { id: doc.id, version: doc.version },
        data: {
          ...encode(doc, config),
          version: { increment: 1 },
          changedAt: new Date(),
        },
      });
      if (!result.count)
        fail(409, "Record changed; refresh and retry", "stale_version");
      // Targets are mutable associations; snapshots and publication targets stay immutable.
      if (config.junctions.length)
        await delegate.update({
          where: { id: doc.id },
          data: nestedData(doc, config, true),
        });
      return this.get(doc.id);
    },
  };
}
