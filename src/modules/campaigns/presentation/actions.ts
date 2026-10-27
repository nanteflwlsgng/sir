"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/shared/auth/guards";
import { getRequestContext } from "@/shared/http/request-context";
import { campaignAdminSchema } from "../application/validation";
import { campaignsContainer } from "../infrastructure/container";
import { type Campaign } from "../domain/campaign";

export async function createCampaignAction(formData: FormData) {
  const user = await requireUser();

  const input = {
    label: formData.get("label") as string,
    startsOn: formData.get("startsOn") as string,
    endsOn: formData.get("endsOn") as string,
  };

  const parsed = campaignAdminSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const context = getRequestContext();
  const result = await campaignsContainer.campaigns.create(
    { ...parsed.data, createdBy: user.id },
    user
  );

  if (!result.ok) {
    return {
      error: getCampaignErrorMessage(result.error),
      fieldErrors: result.error === "conflict" ? { label: "Une campagne active existe déjà" } : {},
    };
  }

  redirect("/campaigns");
}

function getCampaignErrorMessage(error: "not_found" | "forbidden" | "invalid_transition" | "conflict"): string {
  switch (error) {
    case "not_found":
      return "Campagne non trouvée";
    case "forbidden":
      return "Vous n'avez pas les permissions";
    case "invalid_transition":
      return "Transition de statut invalide";
    case "conflict":
      return "Cette opération créerait un conflit";
    default:
      return "Une erreur est survenue";
  }
}