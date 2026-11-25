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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Validate server environment configuration lazily at runtime (not during `next build` page-data collection)
    getServerEnv();
    globalForPrisma.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
