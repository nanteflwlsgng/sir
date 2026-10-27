import { z } from "zod";

/** Règles de validation partagées entre l'inscription et la gestion des comptes. */

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`)
  .max(200, "Le mot de passe est trop long.")
  .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "L'identifiant doit contenir au moins 3 caractères.")
  .max(40, "L'identifiant ne peut pas dépasser 40 caractères.")
  .regex(/^[a-zA-Z0-9._-]+$/, "L'identifiant ne peut contenir que lettres, chiffres, points, tirets et underscores.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "L'adresse e-mail est trop longue.")
  .email("Adresse e-mail invalide.");

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "Ce champ doit contenir au moins 2 caractères.")
  .max(80, "Ce champ ne peut pas dépasser 80 caractères.");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Renseignez votre identifiant ou votre e-mail.").max(160),
  password: z.string().min(1, "Renseignez votre mot de passe.").max(200),
});

export const registerSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  acteurId: z.coerce.number().int().positive("Sélectionnez votre organisme."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Renseignez votre mot de passe actuel.").max(200),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Confirmez le nouveau mot de passe."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
