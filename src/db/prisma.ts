// ============================================================================
// VaultEdge — Prisma Client Singleton (Server-Only)
// Prevents connection pool exhaustion during Next.js hot reloads in development.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { getServerEnv } from "@/config/env";

if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY_VIOLATION: Database client must never be imported in Client Components."
  );
}

// Validate server environment configuration before instantiating PrismaClient
getServerEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
