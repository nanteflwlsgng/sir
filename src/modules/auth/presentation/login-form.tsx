"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/shared/presentation/ui/alert";
import { Field, inputClasses } from "@/shared/presentation/ui/field";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { loginAction } from "./actions";
import { INITIAL_LOGIN_STATE } from "./form-state";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_LOGIN_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert variant="danger">{state.error}</Alert> : null}

      <Field label="Identifiant ou e-mail" htmlFor="identifier" required>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoFocus
          required
          defaultValue={state.identifier ?? ""}
          className={inputClasses}
          placeholder="ex. admin"
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password" required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
          placeholder="••••••••"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>

      <p className="text-center text-xs text-zinc-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-emerald-700 hover:underline">
          Demander un accès
        </Link>
      </p>
    </form>
  );
}
