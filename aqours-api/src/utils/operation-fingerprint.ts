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
  if (Object.hasOwn(body, "password")) {
    const password = z.string().max(200).parse(body.password);
    const salt = sha256(
      JSON.stringify(["aqours-operation-password-v1", actor, scope, key]),
    );
    const derived = (await derive(password, salt, 64)) as Buffer;
    protectedBody = {
      ...body,
      password: `scrypt-v1:${derived.toString("hex")}`,
    };
  }
  return sha256(JSON.stringify(protectedBody));
}
