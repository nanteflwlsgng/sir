import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/shared/auth/guards";
import { usersContainer } from "@/modules/users/infrastructure/container";
import { ResetPasswordForm } from "@/modules/users/presentation/reset-password-form";
import { Card, CardBody, CardHeader } from "@/shared/presentation/ui/card";
import { userStatusBadge } from "@/shared/presentation/ui/badge";

export const metadata: Metadata = { title: "Réinitialiser un mot de passe" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await usersContainer.get(admin, id);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/administration/utilisateurs"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Utilisateurs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Réinitialiser le mot de passe
        </h1>
      </div>

      <Card>
        <CardHeader title="Compte concerné" />
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-zinc-500">
              {user.username} · {user.email}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {user.roleLabel} · {user.acteurAbbreviation} · {user.siteLabel}
            </p>
          </div>
          {userStatusBadge(user.status)}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Nouveau mot de passe"
          description="Communiquez-le à l'agent par un canal sûr. Il devra le changer à la prochaine connexion."
        />
        <CardBody>
          <ResetPasswordForm userId={user.id} />
        </CardBody>
      </Card>
    </div>
  );
}
