import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/shared/auth/guards";
import { Alert } from "@/shared/presentation/ui/alert";
import { Card, CardBody, CardHeader } from "@/shared/presentation/ui/card";
import { displayName, userScopeLabel } from "@/modules/auth/domain/account";
import { formatDateTime } from "@/shared/presentation/format";

export const metadata: Metadata = { title: "Tableau de bord" };

const UPCOMING = [
  { label: "Campagnes & référentiels", detail: "Source unique pour campagnes, régions et espèces" },
  { label: "Planifications", detail: "Objectifs RPF et superficies prévues" },
  { label: "Réalisations", detail: "Plantations, interventions et suivi" },
  { label: "Pépinières", detail: "Production, sorties et stock calculé" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ acces?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Bonjour, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {userScopeLabel(user)} · Campagne en cours pilotée par l&apos;administration
        </p>
      </div>

      {params.acces === "refuse" ? (
        <Alert variant="warning" title="Accès refusé">
          Cette page est réservée aux administrateurs.
        </Alert>
      ) : null}

      {user.mustChangePassword ? (
        <Alert variant="warning" title="Mot de passe à renouveler">
          Votre mot de passe a été réinitialisé par un administrateur.{" "}
          <Link href="/mon-compte" className="font-semibold underline">
            Changez-le maintenant
          </Link>
          .
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Votre périmètre" description="Portée appliquée à toutes vos données." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Info label="Rôle" value={user.role.label} />
            <Info label="Site" value={user.site?.label ?? "—"} />
            <Info label="Organisme" value={user.acteur ? `${user.acteur.abbreviation} — ${user.acteur.name}` : "—"} />
            <Info label="Région" value={user.region?.label ?? "—"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sécurité" />
          <CardBody className="space-y-4">
            <Info label="Identifiant" value={user.username} />
            <Info label="Dernière connexion" value={formatDateTime(user.lastLoginAt)} />
            <Link
              href="/mon-compte"
              className="inline-flex text-xs font-semibold text-emerald-700 hover:underline"
            >
              Modifier mon mot de passe →
            </Link>
          </CardBody>
        </Card>
      </div>

      {user.role.rank >= 50 ? (
        <Card>
          <CardHeader
            title="Administration"
            description="Valider les comptes et les organismes avant leur mise en service."
          />
          <CardBody className="flex flex-wrap gap-3">
            <Link
              href="/administration/acteurs"
              className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Organismes & acteurs →
            </Link>
            {user.role.code === "admin" ? (
              <Link
                href="/administration/utilisateurs"
                className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Comptes utilisateurs →
              </Link>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Prochains modules"
          description="Le socle d'authentification et de périmètre est opérationnel. Les modules métier arrivent par tranches verticales."
        />
        <CardBody>
          <ul className="divide-y divide-zinc-100">
            {UPCOMING.map((item, index) => (
              <li key={item.label} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <p className="text-center text-[11px] text-zinc-400">
        Connecté en tant que {displayName(user)} · {user.email}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900">{value}</p>
    </div>
  );
}
