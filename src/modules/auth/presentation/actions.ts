"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/shared/auth/guards";
import { getRequestContext } from "@/shared/http/request-context";
import { changePasswordSchema, loginSchema, registerSchema } from "../application/validation";
import type { LoginFailure } from "../application/login";
import { authContainer } from "../infrastructure/container";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "../infrastructure/session-cookie";
import {
  INITIAL_CHANGE_PASSWORD_STATE,
  type ChangePasswordFormState,
  type LoginFormState,
  type RegisterFormState,
} from "./form-state";

const LOGIN_ERRORS: Record<LoginFailure, string> = {
  invalid_credentials: "Identifiant ou mot de passe incorrect.",
  account_pending: "Votre compte est en attente de validation par un administrateur.",
  account_suspended: "Votre compte a été suspendu. Contactez un administrateur.",
  too_many_attempts: "Trop de tentatives échouées. Réessayez dans quelques minutes.",
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const identifier = readString(formData, "identifier").trim();

  const parsed = loginSchema.safeParse({
    identifier,
    password: readString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: "Renseignez votre identifiant et votre mot de passe.", identifier };
  }

  const context = await getRequestContext();

  try {
    const result = await authContainer.login({ ...parsed.data, ...context });
    if (!result.ok) {
      return { error: LOGIN_ERRORS[result.code], identifier };
    }
    await setSessionCookie(result.token, result.expiresAt);
  } catch (error) {
    console.error("[auth] échec de connexion", error);
    return { error: "Une erreur technique est survenue. Réessayez.", identifier };
  }

  redirect("/tableau-de-bord");
}

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const values = {
    firstName: readString(formData, "firstName").trim(),
    lastName: readString(formData, "lastName").trim(),
    username: readString(formData, "username").trim(),
    email: readString(formData, "email").trim(),
    acteurId: readString(formData, "acteurId"),
  };

  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  const parsed = registerSchema.safeParse({ ...values, password });
  if (!parsed.success) {
    const fieldErrors: RegisterFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof RegisterFormState["fieldErrors"]] = issue.message;
      }
    }
    return { fieldErrors, values };
  }

  if (password !== confirmPassword) {
    return {
      fieldErrors: { password: "Les deux mots de passe ne correspondent pas." },
      values,
    };
  }

  const context = await getRequestContext();

  try {
    const result = await authContainer.register(parsed.data, context);
    if (!result.ok) {
      return { fieldErrors: result.fieldErrors, values };
    }
  } catch (error) {
    console.error("[auth] échec d'inscription", error);
    return {
      formError: "Une erreur technique est survenue. Réessayez dans un instant.",
      fieldErrors: {},
      values,
    };
  }

  redirect("/connexion?inscription=ok");
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    try {
      await authContainer.logout(token);
    } catch (error) {
      console.error("[auth] échec de déconnexion", error);
    }
  }
  await clearSessionCookie();
  redirect("/connexion");
}

export async function changePasswordAction(
  _previousState: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  const user = await requireUser();

  const currentPassword = readString(formData, "currentPassword");
  const newPassword = readString(formData, "newPassword");
  const confirmPassword = readString(formData, "confirmPassword");

  const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
  if (!parsed.success) {
    const fieldErrors: NonNullable<ChangePasswordFormState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "currentPassword" || key === "newPassword" || key === "confirmPassword") {
        fieldErrors[key] ??= issue.message;
      }
    }
    return { ...INITIAL_CHANGE_PASSWORD_STATE, fieldErrors };
  }

  try {
    const result = await authContainer.changeOwnPassword(user.id, parsed.data);
    if (!result.ok) {
      return { ...INITIAL_CHANGE_PASSWORD_STATE, error: result.error };
    }
  } catch (error) {
    console.error("[auth] échec de changement de mot de passe", error);
    return { ...INITIAL_CHANGE_PASSWORD_STATE, error: "unexpected" };
  }

  return { success: true };
}
