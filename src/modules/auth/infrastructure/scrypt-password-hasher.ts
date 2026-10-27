import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "../domain/ports";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const PARAMS = { N: 16_384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 } as const;

function normalize(password: string): string {
  return password.normalize("NFKC");
}

/**
 * Implémentation scrypt (memory-hard, native Node, sans dépendance externe).
 * Format stocké : scrypt$N$r$p$salt(base64url)$hash(base64url)
 * Remplaçable par Argon2id sans impact sur le domaine (port PasswordHasher).
 */
export const scryptPasswordHasher: PasswordHasher = {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await scrypt(normalize(plainPassword), salt, PARAMS.keylen, {
      N: PARAMS.N,
      r: PARAMS.r,
      p: PARAMS.p,
      maxmem: PARAMS.maxmem,
    });
    return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  },

  async verify(plainPassword: string, storedHash: string): Promise<boolean> {
    try {
      const parts = storedHash.split("$");
      if (parts.length !== 6 || parts[0] !== "scrypt") {
        return false;
      }
      const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
      const N = Number(nRaw);
      const r = Number(rRaw);
      const p = Number(pRaw);
      if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
        return false;
      }

      const expected = Buffer.from(hashRaw ?? "", "base64url");
      const salt = Buffer.from(saltRaw ?? "", "base64url");
      if (expected.length === 0 || salt.length === 0) {
        return false;
      }

      const derived = await scrypt(normalize(plainPassword), salt, expected.length, {
        N,
        r,
        p,
        maxmem: PARAMS.maxmem,
      });

      return expected.length === derived.length && timingSafeEqual(expected, derived);
    } catch {
      return false;
    }
  },
};
