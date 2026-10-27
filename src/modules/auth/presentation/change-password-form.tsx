"use client";

import { useActionState } from "react";
import { Alert } from "@/shared/presentation/ui/alert";
import { Field, inputClasses } from "@/shared/presentation/ui/field";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { changePasswordAction } from "./actions";
import { INITIAL_CHANGE_PASSWORD_STATE } from "./form-state";

const ERRORS = {
  invalid_current_password: "Le mot de passe actuel est incorrect.",
  same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
  validation: "Vérifiez les champs du formulaire.",
  unexpected: "Une erreur technique est survenue. Réessayez.",
} as const;

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, INITIAL_CHANGE_PASSWORD_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.success ? (
        <Alert variant="success">Votre mot de passe a été modifié.</Alert>
      ) : null}
      {state.error ? <Alert variant="danger">{ERRORS[state.error]}</Alert> : null}

      <Field label="Mot de passe actuel" htmlFor="currentPassword" required error={state.fieldErrors?.currentPassword}>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </Field>

      <Field
        label="Nouveau mot de passe"
        htmlFor="newPassword"
        hint="8 caractères minimum, au moins une lettre et un chiffre."
        required
        error={state.fieldErrors?.newPassword}
      >
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
      </Field>

      <Field label="Confirmation" htmlFor="confirmPassword" required error={state.fieldErrors?.confirmPassword}>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
      </Field>

      <SubmitButton pendingLabel="Enregistrement…">Modifier le mot de passe</SubmitButton>
    </form>
  );
}
