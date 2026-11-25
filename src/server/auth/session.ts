// ============================================================================
// VaultEdge — Server Component Session & Role Guard Utilities
// Reads HttpOnly cookie, verifies JWT, and checks live PostgreSQL role & status.
// Never trusts client-supplied roles or stale JWT claims if DB role changed.
// ============================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { ACCESS_TOKEN_COOKIE } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/jwt";
import { toSafeUserDTO } from "@/server/auth/mappers";
import { getDashboardRouteForRole } from "@/config/routes";
import type { SafeUserDTO } from "@/types/auth.types";

/**
 * Resolves the currently authenticated user in a Server Component by reading
 * the HttpOnly `ve_access_token` cookie and fetching the authoritative user
 * record (and current role/status) directly from PostgreSQL.
 */
export async function getServerSessionUser(): Promise<SafeUserDTO | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token || token.trim().length === 0) {
      return null;
    }

    const payload = await verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { customerProfile: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return toSafeUserDTO(user);
  } catch {
    return null;
  }
}

/**
 * Enforces role-based authorization for Server Component dashboard layouts/pages.
 * - If unauthenticated or inactive -> redirects to `/login`.
 * - If authenticated user's authoritative PostgreSQL role does not match `allowedRoles`
 *   -> redirects immediately to their actual role's dashboard (`/admin/overview`,
 *   `/staff/overview`, or `/customer/overview`).
 */
export async function requireServerRole(
  allowedRoles: readonly UserRole[]
): Promise<SafeUserDTO> {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(getDashboardRouteForRole(user.role));
  }

  return user;
}
