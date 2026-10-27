import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/shared/auth/guards";
import { acteursContainer } from "@/modules/acteurs/infrastructure/container";
import { ActeurForm } from "@/modules/acteurs/presentation/acteur-form";
import { ActeurTable } from "@/modules/acteurs/presentation/acteur-table";
import { Card, CardBody, CardHeader } from "@/shared/presentation/ui/card";
import { Alert } from "@/shared/presentation/ui/alert";
import { cn } from "@/shared/presentation/cn";
import type { ActeurStatus } from "@/modules/auth/domain/account";

export const metadata: Metadata = { title: "Acteurs" };

const OK_MESSAGES: Record<string, string> = {
  valide: "L'organisme a été validé.",
  rejete: "L'organisme a été rejeté.",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "Organisme introuvable.",
  invalid_transition: "Cette action n'est pas possible dans l'état actuel de l'organisme.",
  motif: "Un motif de rejet est requis (3 caractères minimum).",
  forbidden: "Action réservée aux administrateurs.",
};

const TABS: Array<{ value: ActeurStatus | "tous"; label: string }> = [
  { value: "tous", label: "Tous" },
  { value: "soumis", label: "En attente" },
  { value: "valide", label: "Validés" },
  { value: "rejete", label: "Rejetés" },
];

function isStatus(value: string): value is ActeurStatus | "tous" {
  return TABS.some((tab) => tab.value === value);
}

export default async function ActeursPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; ok?: string; erreur?: string }>;
}) {
  const manager = await requireManager();
  const params = await searchParams;

  const status = isStatus(params.statut ?? "") ? (params.statut as ActeurStatus | "tous") : "tous";

  const [acteurs, sites, allActeurs] = await Promise.all([
    acteursContainer.list(manager, status),
    acteursContainer.sites(manager),
    acteursContainer.list(manager, "tous"),
  ]);

  const pendingCount = allActeurs.filter((acteur) => acteur.status === "soumis").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Acteurs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Référentiel des organismes habilités à saisir ou mettre en œuvre le reboisement.
        </p>
      </div>

      {params.ok && OK_MESSAGES[params.ok] ? (
        <Alert variant="success">{OK_MESSAGES[params.ok]}</Alert>
      ) : null}
      {params.erreur && ERROR_MESSAGES[params.erreur] ? (
        <Alert variant="danger">{ERROR_MESSAGES[params.erreur]}</Alert>
      ) : null}

      {pendingCount > 0 ? (
        <Alert variant="warning" title={`${pendingCount} organisme(s) en attente`}>
          Les organismes validés sont les seuls proposés lors de l&apos;inscription.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Organismes" description={`${acteurs.length} résultat(s) affiché(s)`} />

          <div className="flex flex-wrap gap-1 border-b border-zinc-200 px-4 py-2">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value === "tous" ? "/administration/acteurs" : `/administration/acteurs?statut=${tab.value}`}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  status === tab.value
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <ActeurTable acteurs={acteurs} />
        </Card>

        <Card className="h-fit">
          <CardHeader
            title="Nouvel organisme"
            description="Créé directement validé (usage administrateur)."
          />
          <CardBody>
            <ActeurForm sites={sites} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
