import { createHash, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

const derive = promisify(scrypt);
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

// Operation records must not become fast offline password verifiers. A public,
// per-operation salt preserves exact retry matching while imposing scrypt cost.
export async function operationFingerprint(
  actor: string,
  scope: string,
  key: string,
  body: Record<string, unknown>,
) {
  let protectedBody = body;
  for (const field of ["password", "currentPassword", "newPassword"]) {
    if (!Object.hasOwn(body, field)) continue;
    const password = z.string().max(200).parse(body[field]);
    const salt = sha256(
      JSON.stringify([
        "aqours-operation-password-v1",
        actor,
        scope,
        key,
        ...(field === "password" ? [] : [field]),
      ]),
    );
    const derived = (await derive(password, salt, 64)) as Buffer;
    protectedBody = {
      ...protectedBody,
      [field]: `scrypt-v1:${derived.toString("hex")}`,
    };
  }
  return sha256(JSON.stringify(protectedBody));
}
