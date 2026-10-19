import { test } from "node:test";
import assert from "node:assert/strict";
import type { ActorRequest } from "../src/middleware/authentication.js";
import type { DB } from "../src/config/database.js";
import {
  advisoryPublisher,
  advisoryTargets,
} from "../src/services/advisories/advisory-context.service.js";

test("publication rechecks current administrator and session while holding the user lock", async () => {
  const queries: string[] = [];
  const actor = { id: "admin", version: 1, active: true, role: "admin" };
  let sessionValid = true;
  const db = {
    $queryRaw: async (parts: TemplateStringsArray | { strings: string[] }) => {
      queries.push(
        Array.from("strings" in parts ? parts.strings : parts).join("?"),
      );
      return [];
    },
    user: { findUnique: async () => actor },
    session: {
      findFirst: async (args: { where: Record<string, unknown> }) => {
        assert.equal(args.where.revokedAt, null);
        assert.ok(args.where.expiresAt);
        return sessionValid ? { tokenHash: "session" } : null;
      },
    },
  } as unknown as DB;
  const req = {
    actor: { ...actor },
    session: { hash: "session" },
  } as ActorRequest;
  await advisoryPublisher(db, req);
  assert.match(queries[0]!, /FOR UPDATE$/);

  sessionValid = false;
  await assert.rejects(() => advisoryPublisher(db, req), { status: 401 });
  actor.role = "staff";
  await assert.rejects(() => advisoryPublisher(db, req), { status: 403 });
  actor.role = "admin";
  actor.active = false;
  await assert.rejects(() => advisoryPublisher(db, req), { status: 403 });
});

test("publication locks current targets and rejects a zone deactivated after draft creation", async () => {
  const calls: { kind: string; id: string; sql: string }[] = [];
  let active = true;
  const db = {
    $queryRaw: async (query: { strings: string[]; values: string[] }) => {
      const sql = query.strings.join("?");
      calls.push({
        kind: sql.includes("service_connections") ? "connection" : "zone",
        id: query.values[0]!,
        sql,
      });
      return [];
    },
    serviceConnection: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        version: 2,
      }),
    },
    zone: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        version: 2,
        active,
      }),
    },
  } as unknown as DB;
  const doc = {
    id: "draft",
    version: 1,
    zoneIds: ["zone"],
    connectionIds: ["b", "a"],
  };
  await advisoryTargets(db, doc);
  assert.deepEqual(
    calls.map((v) => [v.kind, v.id]),
    [
      ["connection", "a"],
      ["connection", "b"],
      ["zone", "zone"],
    ],
  );
  assert.ok(calls.every((v) => v.sql.endsWith("FOR UPDATE")));
  active = false;
  await assert.rejects(() => advisoryTargets(db, doc), { status: 400 });
  await assert.rejects(
    () => advisoryTargets(db, { ...doc, zoneIds: [], connectionIds: [] }),
    {
      status: 400,
    },
  );
});
