// ============================================================================
// VaultEdge — Server-Side Authentication & Role-Based Access Control (RBAC) Guards
// Enforces authoritative database user status and role verification (Admin, Staff, Customer).
// ============================================================================

import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { extractAccessToken } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/jwt";
import { toSafeUserDTO } from "@/server/auth/mappers";
import {
  AccountStatusError,
  AuthenticationError,
  AuthorizationError,
} from "@/server/errors/app-error";
import type { SafeUserDTO } from "@/types/auth.types";

/**
 * Verifies the caller's JWT access token (from Authorization Bearer header or HttpOnly cookie)
 * and re-verifies the user's authoritative role and ACTIVE status in PostgreSQL.
 */
export async function requireAuthenticatedUser(
  request: NextRequest
): Promise<SafeUserDTO> {
  const token = extractAccessToken(request);
  if (!token) {
    throw new AuthenticationError(
      "Authentication required. Please sign in to continue."
    );
  }

  const payload = await verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { customerProfile: true },
  });

  if (!user) {
    throw new AuthenticationError("Authenticated user account no longer exists.");
  }

  if (user.status === "BLOCKED") {
    throw new AccountStatusError(
      "Your account has been blocked due to a security review. Please contact bank administration."
    );
  }

  if (user.status === "DEACTIVATED") {
    throw new AccountStatusError(
      "Your account is currently deactivated. Please contact bank support."
    );
  }

  return toSafeUserDTO(user);
}

/**
 * Enforces Role-Based Access Control (RBAC) for one or more allowed roles:
 * ADMIN, STAFF, or CUSTOMER.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: readonly UserRole[]
): Promise<SafeUserDTO> {
  const user = await requireAuthenticatedUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Access denied. Required role: ${allowedRoles.join(" or ")}.`
    );
  }

  return user;
}

export async function requireAdmin(request: NextRequest): Promise<SafeUserDTO> {
  return requireRole(request, ["ADMIN"]);
}

export async function requireStaff(request: NextRequest): Promise<SafeUserDTO> {
  return requireRole(request, ["STAFF"]);
}

export async function requireStaffOrAdmin(
  request: NextRequest
): Promise<SafeUserDTO> {
  return requireRole(request, ["ADMIN", "STAFF"]);
}

export async function requireCustomer(
  request: NextRequest
): Promise<SafeUserDTO> {
  return requireRole(request, ["CUSTOMER"]);
}
