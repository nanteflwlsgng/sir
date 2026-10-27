import type { ActeurListItem } from "../domain/acteur";
import { acteurStatusBadge } from "@/shared/presentation/ui/badge";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { formatDate } from "@/shared/presentation/format";
import { rejectActeurAction, validateActeurAction } from "./actions";

export function ActeurTable({ acteurs }: { acteurs: ActeurListItem[] }) {
  if (acteurs.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-zinc-500">
        Aucun organisme ne correspond à ce filtre.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-2.5 font-medium">Organisme</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Périmètre</th>
            <th className="px-4 py-2.5 font-medium">Comptes</th>
            <th className="px-4 py-2.5 font-medium">Statut</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {acteurs.map((acteur) => (
            <tr key={acteur.id} className="align-top hover:bg-zinc-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{acteur.abbreviation}</p>
                <p className="max-w-[280px] text-xs text-zinc-600">{acteur.name}</p>
                <p className="text-[11px] text-zinc-400">Créé le {formatDate(acteur.createdAt)}</p>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-600">{acteur.type}</td>
              <td className="px-4 py-3 text-xs text-zinc-600">
                <p>{acteur.siteLabel}</p>
                <p className="text-zinc-400">{acteur.regionLabel}</p>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-600">{acteur.userCount}</td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  {acteurStatusBadge(acteur.status)}
                  {acteur.rejectionReason ? (
                    <p className="max-w-[180px] text-[11px] text-red-600">{acteur.rejectionReason}</p>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-end gap-1.5">
                  {acteur.status !== "valide" ? (
                    <form action={validateActeurAction}>
                      <input type="hidden" name="acteurId" value={acteur.id} />
                      <SubmitButton size="sm" pendingLabel="Validation…">
                        Valider
                      </SubmitButton>
                    </form>
                  ) : null}

                  {acteur.status !== "rejete" ? (
                    <details className="w-52">
                      <summary className="cursor-pointer list-none text-right text-[11px] font-medium text-zinc-500 hover:text-red-700">
                        Rejeter…
                      </summary>
                      <form action={rejectActeurAction} className="mt-2 space-y-1.5">
                        <input type="hidden" name="acteurId" value={acteur.id} />
                        <label htmlFor={`reason-${acteur.id}`} className="sr-only">
                          Motif du rejet
                        </label>
                        <input
                          id={`reason-${acteur.id}`}
                          name="reason"
                          required
                          minLength={3}
                          maxLength={200}
                          placeholder="Motif du rejet"
                          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        />
                        <SubmitButton size="sm" variant="danger" className="w-full" pendingLabel="Rejet…">
                          Confirmer le rejet
                        </SubmitButton>
                      </form>
                    </details>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
