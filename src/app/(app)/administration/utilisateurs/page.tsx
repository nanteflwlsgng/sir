import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/shared/auth/guards";
import { usersContainer } from "@/modules/users/infrastructure/container";
import { UserTable } from "@/modules/users/presentation/user-table";
import { Card, CardBody, CardHeader } from "@/shared/presentation/ui/card";
import { Alert } from "@/shared/presentation/ui/alert";
import { Button } from "@/shared/presentation/ui/button";
import { inputClasses, selectClasses } from "@/shared/presentation/ui/field";
import { cn } from "@/shared/presentation/cn";
import type { UserStatus } from "@/modules/auth/domain/account";

export const metadata: Metadata = { title: "Utilisateurs" };

const OK_MESSAGES: Record<string, string> = {
  confirm: "Le compte a été validé et peut désormais se connecter.",
  suspend: "Le compte a été suspendu et ses sessions ont été fermées.",
  reactivate: "Le compte a été réactivé.",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "Utilisateur introuvable.",
  invalid_transition: "Cette action n'est pas possible dans l'état actuel du compte.",
  self_action: "Vous ne pouvez pas suspendre votre propre compte.",
  forbidden: "Action réservée aux administrateurs.",
};

const STATUSES: Array<{ value: UserStatus | "tous"; label: string }> = [
  { value: "tous", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "actif", label: "Actifs" },
  { value: "suspendu", label: "Suspendus" },
];

function isStatus(value: string): value is UserStatus | "tous" {
  return STATUSES.some((item) => item.value === value);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; ok?: string; erreur?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const search = typeof params.q === "string" ? params.q : "";
  const status = isStatus(params.statut ?? "") ? (params.statut as UserStatus | "tous") : "tous";

  const [users, pendingUsers] = await Promise.all([
    usersContainer.list(admin, { search, status }),
    usersContainer.list(admin, { status: "en_attente" }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Validez les demandes d&apos;accès, suspendez ou réinitialisez les comptes.
          </p>
        </div>
        <span className="text-xs text-zinc-500">{users.length} résultat(s) affiché(s)</span>
      </div>

      {params.ok && OK_MESSAGES[params.ok] ? (
        <Alert variant="success">{OK_MESSAGES[params.ok]}</Alert>
      ) : null}
      {params.erreur && ERROR_MESSAGES[params.erreur] ? (
        <Alert variant="danger">{ERROR_MESSAGES[params.erreur]}</Alert>
      ) : null}

      {pendingUsers.length > 0 ? (
        <Alert variant="warning" title={`${pendingUsers.length} demande(s) en attente`}>
          Un compte non validé ne peut pas se connecter. Traitez les demandes en priorité — elles
          apparaissent en tête de liste.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Comptes"
          description="Périmètre, rôle et statut de chaque agent."
          actions={
            <Link href="/administration/acteurs" className="text-xs font-medium text-emerald-700 hover:underline">
              Gérer les organismes →
            </Link>
          }
        />

        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-zinc-200 px-5 py-3">
          <div className="w-full sm:w-72">
            <label htmlFor="q" className="sr-only">
              Rechercher
            </label>
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Identifiant, nom, e-mail, organisme…"
              className={inputClasses}
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="statut" className="sr-only">
              Statut
            </label>
            <select id="statut" name="statut" defaultValue={status} className={cn(selectClasses)}>
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Filtrer
          </Button>
          {search || status !== "tous" ? (
            <Link
              href="/administration/utilisateurs"
              className="pb-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Réinitialiser
            </Link>
          ) : null}
        </form>

        <UserTable users={users} currentUserId={admin.id} />
      </Card>

      <Card>
        <CardHeader title="Bon à savoir" />
        <CardBody className="space-y-1.5 text-xs text-zinc-600">
          <p>• Un compte suspendu perd immédiatement toutes ses sessions ouvertes.</p>
          <p>• La réinitialisation d&apos;un mot de passe ferme aussi les sessions du compte.</p>
          <p>• Le rôle « Administrateur suppléant » n&apos;a pas accès à la gestion des comptes.</p>
        </CardBody>
      </Card>
    </div>
  );
}
