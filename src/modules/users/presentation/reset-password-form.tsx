"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@/shared/presentation/ui/alert";
import { Field, inputClasses } from "@/shared/presentation/ui/field";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { resetUserPasswordAction, type ResetPasswordState } from "./actions";

const INITIAL: ResetPasswordState = {};

const ERRORS = {
  weak_password: "Mot de passe trop faible : 8 caractères minimum, avec au moins une lettre et un chiffre.",
  mismatch: "La confirmation ne correspond pas au mot de passe saisi.",
  not_found: "Utilisateur introuvable.",
  forbidden: "Action non autorisée.",
} as const;

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(resetUserPasswordAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="userId" value={userId} />

      {state.ok ? (
        <Alert variant="success" title="Mot de passe réinitialisé">
          L&apos;utilisateur devra définir un nouveau mot de passe à sa prochaine connexion. Ses
          sessions ouvertes ont été fermées.
        </Alert>
      ) : null}

      {state.error ? <Alert variant="danger">{ERRORS[state.error]}</Alert> : null}

      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        hint="8 caractères minimum, au moins une lettre et un chiffre."
        required
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
      </Field>

      <Field label="Confirmation" htmlFor="confirmation" required>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton pendingLabel="Réinitialisation…">Réinitialiser le mot de passe</SubmitButton>
        <Link
          href="/administration/utilisateurs"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          Retour à la liste
        </Link>
      </div>
    </form>
  );
}
