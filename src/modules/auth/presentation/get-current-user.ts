import "server-only";
import { cache } from "react";
import type { AuthenticatedUser } from "../domain/account";
import { authContainer } from "../infrastructure/container";
import { readSessionToken } from "../infrastructure/session-cookie";

/**
 * Utilisateur courant, mémoïsé pour la durée d'une requête.
 * Toute lecture de données protégées doit passer par cette fonction (ou les gardes).
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const token = await readSessionToken();
  if (!token) {
    return null;
  }
  return authContainer.resolveSession(token);
});
