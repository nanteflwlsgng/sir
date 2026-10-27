"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/shared/auth/guards";
import { acteursContainer } from "../infrastructure/container";
import { INITIAL_CREATE_ACTEUR_STATE, type CreateActeurState } from "./form-state";

const PATH = "/administration/acteurs";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createActeurAction(
  _previousState: CreateActeurState,
  formData: FormData,
): Promise<CreateActeurState> {
  const manager = await requireManager();

  const values = {
    abbreviation: readField(formData, "abbreviation"),
    name: readField(formData, "name"),
    type: readField(formData, "type"),
    siteId: readField(formData, "siteId"),
  };

  const result = await acteursContainer.create(manager, values);
  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, values };
  }

  revalidatePath(PATH);
  return {
    ok: true,
    createdName: values.name,
    fieldErrors: {},
    values: INITIAL_CREATE_ACTEUR_STATE.values,
  };
}

export async function validateActeurAction(formData: FormData): Promise<void> {
  const manager = await requireManager();
  const acteurId = Number(readField(formData, "acteurId"));

  if (!Number.isInteger(acteurId) || acteurId <= 0) {
    redirect(`${PATH}?erreur=not_found`);
  }

  const result = await acteursContainer.validate(manager, acteurId);
  revalidatePath(PATH);
  redirect(result.ok ? `${PATH}?ok=valide` : `${PATH}?erreur=${result.error}`);
}

export async function rejectActeurAction(formData: FormData): Promise<void> {
  const manager = await requireManager();
  const acteurId = Number(readField(formData, "acteurId"));
  const reason = readField(formData, "reason");

  if (!Number.isInteger(acteurId) || acteurId <= 0) {
    redirect(`${PATH}?erreur=not_found`);
  }
  if (reason.length < 3) {
    redirect(`${PATH}?erreur=motif`);
  }

  const result = await acteursContainer.reject(manager, acteurId, reason);
  revalidatePath(PATH);
  redirect(result.ok ? `${PATH}?ok=rejete` : `${PATH}?erreur=${result.error}`);
}
