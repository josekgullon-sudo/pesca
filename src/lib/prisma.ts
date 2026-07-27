import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 conecta a la base de datos a través de un "driver adapter".
// Para migrar a PostgreSQL: `npm i @prisma/adapter-pg` y sustituir estas dos
// líneas por `new PrismaPg({ connectionString: process.env.DATABASE_URL })`,
// además de cambiar el `provider` en prisma/schema.prisma.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });

// En desarrollo Next.js recarga los módulos en caliente; sin este singleton se
// abrirían conexiones nuevas en cada recarga hasta agotar el pool.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
