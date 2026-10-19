/** Internal workflow value. Persistence fields are defined by generated Prisma domain models. */
export type Doc = Record<string, any> & { id: string; version: number };
