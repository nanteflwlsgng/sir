import type { RegisterField } from "../application/register";

export interface LoginFormState {
  error?: string;
  identifier?: string;
}

export const INITIAL_LOGIN_STATE: LoginFormState = {};

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  acteurId: string;
}

export interface RegisterFormState {
  formError?: string;
  fieldErrors: Partial<Record<RegisterField, string>>;
  values: RegisterFormValues;
}

export const INITIAL_REGISTER_STATE: RegisterFormState = {
  fieldErrors: {},
  values: { firstName: "", lastName: "", username: "", email: "", acteurId: "" },
};

export interface ChangePasswordFormState {
  success?: boolean;
  error?: "invalid_current_password" | "same_password" | "validation" | "unexpected";
  fieldErrors?: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
}

export const INITIAL_CHANGE_PASSWORD_STATE: ChangePasswordFormState = {};
