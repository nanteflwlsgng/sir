"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ValidatedActeurOption } from "../domain/ports";
import { Alert } from "@/shared/presentation/ui/alert";
import { Field, inputClasses, selectClasses } from "@/shared/presentation/ui/field";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { registerAction } from "./actions";
import { INITIAL_REGISTER_STATE } from "./form-state";

export function RegisterForm({ acteurs }: { acteurs: ValidatedActeurOption[] }) {
  const [state, formAction] = useActionState(registerAction, INITIAL_REGISTER_STATE);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.formError ? <Alert variant="danger">{state.formError}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="firstName" required error={errors.firstName}>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            defaultValue={state.values.firstName}
            className={inputClasses}
          />
        </Field>

        <Field label="Nom" htmlFor="lastName" required error={errors.lastName}>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            defaultValue={state.values.lastName}
            className={inputClasses}
          />
        </Field>
      </div>

      <Field label="Identifiant" htmlFor="username" hint="Lettres, chiffres, points, tirets et underscores." required error={errors.username}>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          defaultValue={state.values.username}
          className={inputClasses}
        />
      </Field>

      <Field label="Adresse e-mail" htmlFor="email" required error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values.email}
          className={inputClasses}
        />
      </Field>

      <Field
        label="Organisme de rattachement"
        htmlFor="acteurId"
        hint="Le site et la région sont déduits de l'organisme."
        required
        error={errors.acteurId}
      >
        <select
          id="acteurId"
          name="acteurId"
          required
          defaultValue={state.values.acteurId}
          className={selectClasses}
        >
          <option value="">Sélectionner un organisme…</option>
          {acteurs.map((acteur) => (
            <option key={acteur.id} value={acteur.id}>
              {acteur.abbreviation} — {acteur.name} ({acteur.siteLabel} · {acteur.regionLabel})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum, au moins une lettre et un chiffre." required error={errors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={inputClasses}
          />
        </Field>

        <Field label="Confirmation" htmlFor="confirmPassword" required>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={inputClasses}
          />
        </Field>
      </div>

      <Alert variant="info">
        Votre compte restera <strong>inactif</strong> jusqu&apos;à validation par un administrateur.
        Vous ne pourrez pas vous connecter avant cette étape.
      </Alert>

      <SubmitButton className="w-full" pendingLabel="Envoi de la demande…">
        Créer ma demande de compte
      </SubmitButton>

      <p className="text-center text-xs text-zinc-500">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-emerald-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
