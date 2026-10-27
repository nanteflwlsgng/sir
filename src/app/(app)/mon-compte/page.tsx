import type { Metadata } from "next";
import { requireUser } from "@/shared/auth/guards";
import { ChangePasswordForm } from "@/modules/auth/presentation/change-password-form";
import { Card, CardBody, CardHeader } from "@/shared/presentation/ui/card";
import { Alert } from "@/shared/presentation/ui/alert";
import { displayName, userScopeLabel } from "@/modules/auth/domain/account";
import { formatDateTime } from "@/shared/presentation/format";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mon compte</h1>
        <p className="mt-1 text-sm text-zinc-500">Identité, périmètre et sécurité de votre accès.</p>
      </div>

      {user.mustChangePassword ? (
        <Alert variant="warning" title="Renouvellement requis">
          Un administrateur a réinitialisé votre mot de passe. Définissez-en un nouveau pour
          continuer sereinement.
        </Alert>
      ) : null}

      <Card>
        <CardHeader title="Identité" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Info label="Nom complet" value={displayName(user)} />
          <Info label="Identifiant" value={user.username} />
          <Info label="E-mail" value={user.email} />
          <Info label="Rôle" value={user.role.label} />
          <Info label="Périmètre" value={userScopeLabel(user)} />
          <Info label="Dernière connexion" value={formatDateTime(user.lastLoginAt)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Mot de passe"
          description="8 caractères minimum, avec au moins une lettre et un chiffre."
        />
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
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
