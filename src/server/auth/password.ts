// ============================================================================
// VaultEdge — Password Hashing & Cryptographic Token Hashing Utilities
// ============================================================================

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Generates a deterministic SHA-256 hex digest for storing RefreshTokens in PostgreSQL.
 * Raw JWT refresh tokens are never stored in plaintext in the database.
 */
export function hashTokenSha256(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Generates a cryptographically strong unique identifier for token JTI or reference codes.
 */
export function generateCryptoId(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
