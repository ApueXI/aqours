import { Prisma } from "../generated/prisma/client.js";
import type { Doc } from "../types/domain.js";
import type { EntityConfig } from "./entity.repository.js";

export function encode(input: Record<string, any>, config: EntityConfig) {
  return Object.fromEntries(
    Object.entries(config.fields).map(([key, type]) => {
      const value = input[key] ?? null;
      if (type.startsWith("j"))
        return [key, value === null ? Prisma.DbNull : value];
      if (type.startsWith("t"))
        return [key, value === null ? null : new Date(value)];
      return [key, value];
    }),
  );
}
export function nestedData(
  input: Record<string, any>,
  config: EntityConfig,
  update = false,
) {
  const data: Record<string, any> = {};
  for (const field of config.junctions)
    data[field] = {
      ...(update ? { deleteMany: {} } : {}),
      create: [...new Set<string>(input[field] ?? [])].map(
        (targetId, position) => ({ targetId, position }),
      ),
    };
  if (config.kind === "assistance" && !update) {
    const { type, details = {} } = input;
    const fields: Record<string, string[]> = {
      callback: [
        "question",
        "contactMethod",
        "contactNumber",
        "preferredWindow",
      ],
      inspection: [
        "issueDetails",
        "siteAddress",
        "preferredWindow",
        "accessInstructions",
      ],
      water_support: ["requestedLiters", "sessionId", "notes"],
    };
    const relation = type === "water_support" ? "waterSupport" : type;
    data[relation] = {
      create: Object.fromEntries(
        (fields[type] ?? []).map((key) => [key, details[key] ?? null]),
      ),
    };
  }
  return data;
}
export function decode(row: Record<string, any>, config: EntityConfig): Doc {
  const result: Doc = { id: row.id, version: row.version };
  for (const [key, type] of Object.entries(config.fields)) {
    const value = row[key];
    result[key] =
      type.startsWith("t") && value instanceof Date
        ? value.toISOString()
        : value;
  }
  for (const field of config.junctions)
    result[field] = [...row[field]]
      .sort((a, b) => a.position - b.position)
      .map((v) => v.targetId);
  if (config.kind === "assistance") {
    const detail =
      row[row.type === "water_support" ? "waterSupport" : row.type];
    const { requestId: _id, ...fields } = detail ?? {};
    if (fields.requestedLiters != null)
      fields.requestedLiters = fields.requestedLiters.toFixed(2);
    result.details = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value != null),
    );
    if (row.type === "water_support" && !("sessionId" in result.details))
      result.details.sessionId = null;
  }
  return result;
}
