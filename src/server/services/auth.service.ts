// ============================================================================
// VaultEdge — Authentication Domain Service
// Handles Customer Registration, Login, Token Rotation, Logout & Current User.
// ============================================================================

import { prisma } from "@/db/prisma";
import {
  generateCryptoId,
  hashPassword,
  hashTokenSha256,
  verifyPassword,
} from "@/server/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/server/auth/jwt";
import { splitFullName, toSafeUserDTO } from "@/server/auth/mappers";
import {
  AccountStatusError,
  AuthenticationError,
  ConflictError,
} from "@/server/errors/app-error";
import type {
  LoginInput,
  RegisterInput,
} from "@/server/validators/auth.schema";
import type {
  AuthSessionResponseDTO,
  AuthTokenPair,
  SafeUserDTO,
} from "@/types/auth.types";

interface RequestClientMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

function buildUniqueCustomerCode(): string {
  const year = new Date().getUTCFullYear();
  const suffix = generateCryptoId(4).toUpperCase();
  return `CUS-${year}-${suffix}`;
}

function buildFallbackPhone(): string {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `+1${randomDigits}${generateCryptoId(2).toUpperCase()}`;
}

async function issueSessionTokens(params: {
  userId: string;
  email: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
  clientMeta: RequestClientMeta;
}): Promise<AuthTokenPair> {
  const jti = generateCryptoId(16);

  const [accessResult, refreshResult] = await Promise.all([
    signAccessToken({
      userId: params.userId,
      email: params.email,
      role: params.role,
      status: params.status,
    }),
    signRefreshToken({
      userId: params.userId,
      role: params.role,
      jti,
    }),
  ]);

  const tokenHash = hashTokenSha256(refreshResult.token);

  await prisma.refreshToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      ipAddress: params.clientMeta.ipAddress,
      userAgent: params.clientMeta.userAgent,
      expiresAt: refreshResult.expiresAt,
    },
  });

  return {
    accessToken: accessResult.token,
    refreshToken: refreshResult.token,
    accessExpiresIn: accessResult.expiresIn,
    refreshExpiresIn: refreshResult.expiresIn,
    accessMaxAgeSeconds: accessResult.maxAgeSeconds,
    refreshMaxAgeSeconds: refreshResult.maxAgeSeconds,
  };
}

/**
 * 1. Register a new Customer user & CustomerProfile atomically.
 * Role is strictly assigned as `CUSTOMER` (never `ADMIN` or `STAFF`).
 */
export async function registerCustomerUser(
  input: RegisterInput,
  clientMeta: RequestClientMeta
): Promise<{ session: AuthSessionResponseDTO; tokenPair: AuthTokenPair }> {
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingEmail) {
    throw new ConflictError("An account with this email address already exists.");
  }

  if (input.phone) {
    const existingPhone = await prisma.customerProfile.findUnique({
      where: { phone: input.phone },
      select: { id: true },
    });
    if (existingPhone) {
      throw new ConflictError("An account with this phone number already exists.");
    }
  }

  const passwordHash = await hashPassword(input.password);
  const { firstName, lastName } = splitFullName(input.fullName);
  const customerCode = buildUniqueCustomerCode();
  const phoneToSave = input.phone ?? buildFallbackPhone();

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName,
        lastName,
        role: "CUSTOMER",
        status: "ACTIVE",
        lastLoginAt: new Date(),
        customerProfile: {
          create: {
            customerCode,
            phone: phoneToSave,
            kycStatus: "PENDING",
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: "CUSTOMER",
        action: "CUSTOMER_REGISTERED",
        entityType: "User",
        entityId: user.id,
        ipAddress: clientMeta.ipAddress,
        metadata: {
          email: user.email,
          customerCode,
        },
      },
    });

    return user;
  });

  const tokenPair = await issueSessionTokens({
    userId: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
    status: createdUser.status,
    clientMeta,
  });

  const safeUser = toSafeUserDTO(createdUser);

  return {
    tokenPair,
    session: {
      user: safeUser,
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: "Bearer",
        accessExpiresIn: tokenPair.accessExpiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      },
    },
  };
}

/**
 * 2. Authenticate a user with email & password, rejecting blocked/deactivated accounts.
 */
export async function loginUser(
  input: LoginInput,
  clientMeta: RequestClientMeta
): Promise<{ session: AuthSessionResponseDTO; tokenPair: AuthTokenPair }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { customerProfile: true },
  });

  if (!user) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password.");
  }

  if (user.status === "BLOCKED") {
    throw new AccountStatusError(
      "Your account has been blocked due to suspicious activity. Please contact bank administration."
    );
  }

  if (user.status === "DEACTIVATED") {
    throw new AccountStatusError(
      "Your account has been deactivated. Please contact bank support."
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    include: { customerProfile: true },
  });

  const tokenPair = await issueSessionTokens({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    status: updatedUser.status,
    clientMeta,
  });

  return {
    tokenPair,
    session: {
      user: toSafeUserDTO(updatedUser),
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: "Bearer",
        accessExpiresIn: tokenPair.accessExpiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      },
    },
  };
}

/**
 * 3. Rotate a valid Refresh Token, revoking the presented token and preventing reuse.
 */
export async function refreshUserSession(
  rawRefreshToken: string | null,
  clientMeta: RequestClientMeta
): Promise<{ session: AuthSessionResponseDTO; tokenPair: AuthTokenPair }> {
  if (!rawRefreshToken) {
    throw new AuthenticationError("Refresh token is required.");
  }

  const verifiedPayload = await verifyRefreshToken(rawRefreshToken);
  const incomingHash = hashTokenSha256(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: incomingHash },
    include: {
      user: {
        include: { customerProfile: true },
      },
    },
  });

  if (!storedToken) {
    throw new AuthenticationError("Refresh token is invalid or unrecognized.");
  }

  // Reuse Detection: If an already-revoked token is re-submitted, revoke all active tokens for that user
  if (storedToken.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthenticationError(
      "Refresh token has already been revoked. All active sessions have been invalidated for security."
    );
  }

  if (storedToken.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
    throw new AuthenticationError("Refresh token has expired. Please sign in again.");
  }

  if (storedToken.userId !== verifiedPayload.sub) {
    throw new AuthenticationError("Refresh token subject mismatch.");
  }

  const user = storedToken.user;

  if (user.status === "BLOCKED") {
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AccountStatusError(
      "Your account has been blocked. Session terminated."
    );
  }

  if (user.status === "DEACTIVATED") {
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AccountStatusError(
      "Your account is deactivated. Session terminated."
    );
  }

  // Atomically revoke the old refresh token before issuing the rotated pair
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const tokenPair = await issueSessionTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    clientMeta,
  });

  return {
    tokenPair,
    session: {
      user: toSafeUserDTO(user),
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: "Bearer",
        accessExpiresIn: tokenPair.accessExpiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      },
    },
  };
}

/**
 * 4. Logout user by revoking the presented refresh token in PostgreSQL.
 */
export async function logoutUserSession(
  rawRefreshToken: string | null
): Promise<{ revoked: boolean }> {
  if (!rawRefreshToken) {
    return { revoked: false };
  }

  const tokenHash = hashTokenSha256(rawRefreshToken);

  const result = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return { revoked: result.count > 0 };
}

/**
 * 5. Retrieve current authenticated user profile safely.
 */
export async function getCurrentUserProfile(
  userId: string
): Promise<SafeUserDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true },
  });

  if (!user) {
    throw new AuthenticationError("User profile not found.");
  }

  return toSafeUserDTO(user);
}
