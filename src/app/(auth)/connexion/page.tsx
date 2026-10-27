import type { Metadata } from "next";
import { Alert } from "@/shared/presentation/ui/alert";
import { LoginForm } from "@/modules/auth/presentation/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ inscription?: string; deconnexion?: string }>;
}) {
  const params = await searchParams;
  const justRegistered = params.inscription === "ok";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Connexion</h1>
        <p className="text-sm text-zinc-500">
          Accédez à votre espace de saisie et de suivi du reboisement.
        </p>
      </div>

      {justRegistered ? (
        <Alert variant="success" title="Demande enregistrée">
          Votre compte a bien été créé. Un administrateur doit maintenant le valider avant votre
          première connexion.
        </Alert>
      ) : null}

      <LoginForm />
    </div>
  );
}
