import "server-only";
import { redirect } from "next/navigation";
import type { AuthenticatedUser } from "@/modules/auth/domain/account";
import { getCurrentUser } from "@/modules/auth/presentation/get-current-user";

/** Exige une session valide ; redirige vers la connexion sinon. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  return user;
}

/** Exige le rôle administrateur (niveau 100). */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role.code !== "admin") {
    redirect("/tableau-de-bord?acces=refuse");
  }
  return user;
}

/** Exige un rôle de niveau >= 50 (administrateur ou suppléant). */
export async function requireManager(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role.rank < 50) {
    redirect("/tableau-de-bord?acces=refuse");
  }
  return user;
}
