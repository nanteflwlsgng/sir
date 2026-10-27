import type { Metadata } from "next";
import { RegisterForm } from "@/modules/auth/presentation/register-form";
import { authContainer } from "@/modules/auth/infrastructure/container";

export const metadata: Metadata = { title: "Demande de compte" };

export default async function RegisterPage() {
  const acteurs = await authContainer.listValidatedActeurs();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Demander un accès</h1>
        <p className="text-sm text-zinc-500">
          Créez votre compte agent. Toute demande est soumise à validation d&apos;un administrateur.
        </p>
      </div>

      <RegisterForm acteurs={acteurs} />
    </div>
  );
}
