import Link from "next/link";
import type { UserListItem } from "../domain/user";
import { userStatusBadge } from "@/shared/presentation/ui/badge";
import { buttonClasses } from "@/shared/presentation/ui/button";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { formatDateTime } from "@/shared/presentation/format";
import { confirmUserAction, reactivateUserAction, suspendUserAction } from "./actions";

export function UserTable({ users, currentUserId }: { users: UserListItem[]; currentUserId: string }) {
  if (users.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-zinc-500">
        Aucun utilisateur ne correspond aux critères.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-2.5 font-medium">Utilisateur</th>
            <th className="px-4 py-2.5 font-medium">Organisme</th>
            <th className="px-4 py-2.5 font-medium">Rôle</th>
            <th className="px-4 py-2.5 font-medium">Statut</th>
            <th className="px-4 py-2.5 font-medium">Dernière connexion</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id} className="align-top hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">
                    {user.firstName} {user.lastName}
                    {isSelf ? <span className="ml-2 text-[11px] font-normal text-zinc-400">(vous)</span> : null}
                  </p>
                  <p className="text-xs text-zinc-500">{user.username}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-zinc-800">{user.acteurAbbreviation}</p>
                  <p className="max-w-[220px] truncate text-xs text-zinc-500" title={user.acteurName}>
                    {user.acteurName}
                  </p>
                  <p className="text-xs text-zinc-400">{user.siteLabel}</p>
                </td>
                <td className="px-4 py-3">{user.roleLabel}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {userStatusBadge(user.status)}
                    {user.mustChangePassword ? (
                      <p className="text-[11px] text-amber-700">Mot de passe à renouveler</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(user.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {user.status === "en_attente" ? (
                      <form action={confirmUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <SubmitButton size="sm" pendingLabel="Validation…">
                          Valider
                        </SubmitButton>
                      </form>
                    ) : null}

                    {user.status === "actif" && !isSelf ? (
                      <form action={suspendUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <SubmitButton size="sm" variant="secondary" pendingLabel="Suspension…">
                          Suspendre
                        </SubmitButton>
                      </form>
                    ) : null}

                    {user.status === "suspendu" ? (
                      <form action={reactivateUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <SubmitButton size="sm" variant="secondary" pendingLabel="Réactivation…">
                          Réactiver
                        </SubmitButton>
                      </form>
                    ) : null}

                    <Link
                      href={`/administration/utilisateurs/${user.id}/mot-de-passe`}
                      className={buttonClasses("ghost", "sm")}
                    >
                      Mot de passe
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
