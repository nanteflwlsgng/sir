import { z } from "zod";

export const campaignAdminSchema = z.object({
  label: z.string().min(2, "Le label doit contenir au moins 2 caractères").max(100, "Le label ne peut pas dépasser 100 caractères"),
  startsOn: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Date de début invalide"),
  endsOn: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Date de fin invalide"),
}).refine((data) => {
  const startsOn = new Date(data.startsOn);
  const endsOn = new Date(data.endsOn);
  return endsOn > startsOn;
}, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endsOn"],
});