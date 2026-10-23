import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, scryptSync } from "node:crypto";
import { operationFingerprint } from "../src/utils/operation-fingerprint.js";

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const actor = "fictional-actor";
const scope = "POST:/api/v1/staff/settings/accounts";
const key = "fictional-operation-key";

test("account operation retries match while changed passwords and operation scopes differ", async () => {
  const body = {
    email: "fictional@example.test",
    password: "FictionalPassword!123",
  };
  const fingerprint = await operationFingerprint(actor, scope, key, body);
  assert.equal(
    await operationFingerprint(actor, scope, key, { ...body }),
    fingerprint,
  );
  assert.notEqual(
    await operationFingerprint(actor, scope, key, {
      ...body,
      password: "AnotherPassword!123",
    }),
    fingerprint,
  );
  for (const [otherActor, otherScope, otherKey] of [
    ["other-actor", scope, key],
    [actor, "PATCH:/api/v1/staff/settings/accounts/example", key],
    [actor, scope, "other-key"],
  ]) {
    assert.notEqual(
      await operationFingerprint(otherActor!, otherScope!, otherKey!, body),
      fingerprint,
    );
  }
  assert.equal(body.password, "FictionalPassword!123");
});

test("persisted password fingerprints require scrypt and cannot match fast request digests", async () => {
  const body = { password: "FictionalPassword!123", expectedVersion: 2 };
  const fingerprint = await operationFingerprint(actor, scope, key, body);
  const salt = sha256(
    JSON.stringify(["aqours-operation-password-v1", actor, scope, key]),
  );
  const derived = scryptSync(body.password, salt, 64).toString("hex");
  assert.equal(
    fingerprint,
    sha256(JSON.stringify({ ...body, password: `scrypt-v1:${derived}` })),
  );
  assert.notEqual(fingerprint, sha256(JSON.stringify(body)));
  assert.notEqual(
    fingerprint,
    sha256(JSON.stringify({ ...body, password: sha256(body.password) })),
  );
  await assert.rejects(() =>
    operationFingerprint(actor, scope, key, { password: "x".repeat(201) }),
  );
});


test("self-service password changes protect both credential fields without changing account retry compatibility", async () => {
  const body = { currentPassword: "FictionalCurrent!123", newPassword: "FictionalReplacement!123" };
  const passwordScope = "POST:/api/v1/me/password";
  const actual = await operationFingerprint(actor, passwordScope, key, body);
  const protectedBody = Object.fromEntries(Object.entries(body).map(([field, value]) => {
    const salt = sha256(JSON.stringify(["aqours-operation-password-v1", actor, passwordScope, key, field]));
    return [field, `scrypt-v1:${scryptSync(value, salt, 64).toString("hex")}`];
  }));
  assert.equal(actual, sha256(JSON.stringify(protectedBody)));
  assert.notEqual(actual, sha256(JSON.stringify(body)));
  assert.equal(await operationFingerprint(actor, passwordScope, key, body), actual);
  assert.notEqual(await operationFingerprint(actor, passwordScope, key, { ...body, currentPassword: "OtherCurrent!123" }), actual);
});
