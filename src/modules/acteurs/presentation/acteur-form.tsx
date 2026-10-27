"use client";

import { useActionState } from "react";
import { ACTEUR_TYPES } from "../domain/acteur";
import type { SiteOption } from "../domain/acteur";
import { Alert } from "@/shared/presentation/ui/alert";
import { Field, inputClasses, selectClasses } from "@/shared/presentation/ui/field";
import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { createActeurAction } from "./actions";
import { INITIAL_CREATE_ACTEUR_STATE } from "./form-state";

export function ActeurForm({ sites }: { sites: SiteOption[] }) {
  const [state, formAction] = useActionState(createActeurAction, INITIAL_CREATE_ACTEUR_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.ok ? (
        <Alert variant="success">
          L&apos;organisme « {state.createdName} » a été créé et validé.
        </Alert>
      ) : null}
      {state.fieldErrors.form ? <Alert variant="danger">{state.fieldErrors.form}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Abréviation" htmlFor="abbreviation" required error={state.fieldErrors.abbreviation}>
          <input
            id="abbreviation"
            name="abbreviation"
            required
            maxLength={20}
            defaultValue={state.values.abbreviation}
            className={inputClasses}
            placeholder="ex. MEDD"
          />
        </Field>

        <Field label="Type d'acteur" htmlFor="type" required error={state.fieldErrors.type}>
          <select id="type" name="type" required defaultValue={state.values.type} className={selectClasses}>
            <option value="">Sélectionner…</option>
            {ACTEUR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Nom complet" htmlFor="name" required error={state.fieldErrors.name}>
        <input
          id="name"
          name="name"
          required
          maxLength={160}
          defaultValue={state.values.name}
          className={inputClasses}
          placeholder="ex. Ministère de l'Environnement et du Développement Durable"
        />
      </Field>

      <Field
        label="Site de rattachement"
        htmlFor="siteId"
        hint="La région de l'organisme est déduite du site."
        required
        error={state.fieldErrors.siteId}
      >
        <select id="siteId" name="siteId" required defaultValue={state.values.siteId} className={selectClasses}>
          <option value="">Sélectionner un site…</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.label} ({site.kind})
            </option>
          ))}
        </select>
      </Field>

      <SubmitButton pendingLabel="Création…">Créer l&apos;organisme</SubmitButton>
    </form>
  );
}
