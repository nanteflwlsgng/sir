"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/auth/guards";
import { usersContainer } from "../infrastructure/container";

const LIST_PATH = "/administration/utilisateurs";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function runStatusAction(
  formData: FormData,
  action: "confirm" | "suspend" | "reactivate",
): Promise<void> {
  const admin = await requireAdmin();
  const userId = readField(formData, "userId");
  if (!userId) {
    redirect(`${LIST_PATH}?erreur=not_found`);
  }

  const result =
    action === "confirm"
      ? await usersContainer.confirm(admin, userId)
      : action === "suspend"
        ? await usersContainer.suspend(admin, userId)
        : await usersContainer.reactivate(admin, userId);

  revalidatePath(LIST_PATH);
  redirect(result.ok ? `${LIST_PATH}?ok=${action}` : `${LIST_PATH}?erreur=${result.error}`);
}

export async function confirmUserAction(formData: FormData): Promise<void> {
  await runStatusAction(formData, "confirm");
}

export async function suspendUserAction(formData: FormData): Promise<void> {
  await runStatusAction(formData, "suspend");
}

export async function reactivateUserAction(formData: FormData): Promise<void> {
  await runStatusAction(formData, "reactivate");
}

export interface ResetPasswordState {
  ok?: boolean;
  error?: "weak_password" | "mismatch" | "not_found" | "forbidden";
}

export async function resetUserPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireAdmin();
  const userId = readField(formData, "userId");
  const password = readField(formData, "password");
  const confirmation = readField(formData, "confirmation");

  if (!userId) {
    return { error: "not_found" };
  }
  if (password !== confirmation) {
    return { error: "mismatch" };
  }

  const result = await usersContainer.resetPassword(admin, userId, password);
  if (!result.ok) {
    return { error: result.error === "weak_password" ? "weak_password" : "not_found" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true };
}
