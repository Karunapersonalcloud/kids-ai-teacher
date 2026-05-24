import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Stored format: scrypt$<saltHex>$<hashHex>
// We keep a simple, dependency-free scheme so admin seed + change-credentials
// can produce comparable values without adding bcrypt/argon2 packages.

const ALGO = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCRYPT_COST = 16384; // N
const SCRYPT_BLOCK = 8; // r
const SCRYPT_PAR = 1; // p

export function hashPin(pin: string): string {
  if (!pin) throw new Error("pin is required");
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(pin, salt, KEY_BYTES, { N: SCRYPT_COST, r: SCRYPT_BLOCK, p: SCRYPT_PAR });
  return `${ALGO}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function isHashedCredential(stored: string | undefined | null): boolean {
  return typeof stored === "string" && stored.startsWith(`${ALGO}$`);
}

export type VerifyResult = { ok: boolean; legacyPlainMatch: boolean };

export function verifyPin(stored: string | undefined | null, candidate: string): VerifyResult {
  if (!stored || !candidate) return { ok: false, legacyPlainMatch: false };

  if (isHashedCredential(stored)) {
    const [, saltHex, hashHex] = stored.split("$");
    if (!saltHex || !hashHex) return { ok: false, legacyPlainMatch: false };
    let salt: Buffer;
    let expected: Buffer;
    try {
      salt = Buffer.from(saltHex, "hex");
      expected = Buffer.from(hashHex, "hex");
    } catch {
      return { ok: false, legacyPlainMatch: false };
    }
    const derived = scryptSync(candidate, salt, expected.length, { N: SCRYPT_COST, r: SCRYPT_BLOCK, p: SCRYPT_PAR });
    if (derived.length !== expected.length) return { ok: false, legacyPlainMatch: false };
    const ok = timingSafeEqual(derived, expected);
    return { ok, legacyPlainMatch: false };
  }

  // Legacy plain-text credential support: allow login once, caller must force
  // credential change immediately so we can store a real hash next time.
  if (stored.length === candidate.length) {
    const a = Buffer.from(stored);
    const b = Buffer.from(candidate);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { ok: true, legacyPlainMatch: true };
    }
  }
  return { ok: false, legacyPlainMatch: false };
}
