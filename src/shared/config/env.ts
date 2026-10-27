import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  SESSION_COOKIE_NAME: z.string().min(1).default("sir_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(720).default(12),
  APP_NAME: z.string().min(1).default("SIR Reboisement"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_TTL_HOURS: process.env.SESSION_TTL_HOURS,
  APP_NAME: process.env.APP_NAME,
});

if (!parsed.success) {
  throw new Error(
    `Configuration invalide : ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
  );
}

export const env: Env = parsed.data;
