import { createHash, randomBytes } from "node:crypto";

/** Jeton de session opaque : 256 bits d'entropie, jamais stocké en clair. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
