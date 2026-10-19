import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client.js";
import { Fault } from "../utils/errors.js";
import { config } from "./environment.js";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: config.databaseUrl,
    max: 12,
    options: "-c timezone=UTC",
  }),
});
export type DB = Prisma.TransactionClient;
export class CommitUncertain extends Fault {
  constructor() {
    super(
      503,
      "commit_uncertain",
      "Result could not be confirmed; retry with the same operation key",
    );
  }
}

/** An error after the callback succeeds can represent a lost commit acknowledgment. */
export async function withTransaction<T>(
  client: Pick<PrismaClient, "$transaction">,
  fn: (db: DB) => Promise<T>,
): Promise<T> {
  let callbackFinished = false;
  try {
    return await client.$transaction(
      async (db) => {
        const result = await fn(db);
        callbackFinished = true;
        return result;
      },
      { maxWait: 10000, timeout: 30000 },
    );
  } catch (error) {
    const code = (error as { code?: string }).code;
    // These failures guarantee rollback; transport failures after success may not.
    if (
      callbackFinished &&
      !["P2034", "P2002", "P2003", "P2004", "P2028"].includes(code ?? "")
    )
      throw new CommitUncertain();
    throw error;
  }
}
export const transaction = <T>(fn: (db: DB) => Promise<T>) =>
  withTransaction(prisma, fn);
export const disconnect = () => prisma.$disconnect();
