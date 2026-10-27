/**
 * Smoke test d'intégration (base réelle, aucune UI).
 * Usage : npm run test:smoke
 */
import process from "node:process";
import { query } from "@/shared/db/sql";
import { pool } from "@/shared/db/pool";
import { createLogin } from "@/modules/auth/application/login";
import { createRegister } from "@/modules/auth/application/register";
import { createResolveSession } from "@/modules/auth/application/resolve-session";
import { createChangeOwnPassword } from "@/modules/auth/application/change-own-password";
import { postgresAccountRepository } from "@/modules/auth/infrastructure/postgres-account.repository";
import { postgresSessionRepository } from "@/modules/auth/infrastructure/postgres-session.repository";
import { postgresLoginAttemptStore } from "@/modules/auth/infrastructure/postgres-login-attempt.store";
import { postgresAuditLogger } from "@/modules/auth/infrastructure/postgres-audit.logger";
import { postgresRegistrationActorDirectory } from "@/modules/auth/infrastructure/postgres-registration-actor.directory";
import { scryptPasswordHasher } from "@/modules/auth/infrastructure/scrypt-password-hasher";
import { createUserAdministration } from "@/modules/users/application/manage-users";
import { postgresUserAdminRepository } from "@/modules/users/infrastructure/postgres-user-admin.repository";
import { createActeurAdministration } from "@/modules/acteurs/application/manage-acteurs";
import { postgresActeurAdminRepository } from "@/modules/acteurs/infrastructure/postgres-acteur-admin.repository";

const suffix = Date.now().toString(36);
const USERNAME = `smoke_${suffix}`;
const EMAIL = `smoke_${suffix}@example.test`;
const PASSWORD = "Smoke2026!";
const NEW_PASSWORD = "Smoke2027!";

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

const deps = {
  accounts: postgresAccountRepository,
  sessions: postgresSessionRepository,
  hasher: scryptPasswordHasher,
  attempts: postgresLoginAttemptStore,
  audit: postgresAuditLogger,
};

const login = createLogin(deps);
const register = createRegister({ ...deps, actors: postgresRegistrationActorDirectory });
const resolveSession = createResolveSession(deps);
const changeOwnPassword = createChangeOwnPassword(deps);
const users = createUserAdministration({
  users: postgresUserAdminRepository,
  sessions: postgresSessionRepository,
  hasher: scryptPasswordHasher,
  audit: postgresAuditLogger,
});
const acteurs = createActeurAdministration({
  acteurs: postgresActeurAdminRepository,
  audit: postgresAuditLogger,
});

async function main(): Promise<void> {
  console.log("\n[1] Connexion administrateur");
  const adminLogin = await login({ identifier: "admin", password: "Admin@2026!" });
  check("admin authentifié", adminLogin.ok, adminLogin);
  if (!adminLogin.ok) throw new Error("Impossible de continuer sans admin.");
  const admin = adminLogin.user;
  check("rôle admin", admin.role.code === "admin");
  check("périmètre MEDD / CENTRAL", admin.acteur?.abbreviation === "MEDD" && admin.site?.code === "CENTRAL");

  const resolved = await resolveSession(adminLogin.token);
  check("session résolue depuis le jeton", resolved?.id === admin.id);
  check("jeton inconnu rejeté", (await resolveSession("invalide")) === null);

  console.log("\n[2] Inscription publique");
  const { rows: acteurRows } = await query<{ id: number }>(
    "select id from acteurs where status = 'valide' order by id limit 1",
  );
  const acteurId = acteurRows[0]?.id;
  if (!acteurId) throw new Error("Aucun acteur validé en base.");

  const registered = await register(
    {
      firstName: "Test",
      lastName: "Intégration",
      username: USERNAME,
      email: EMAIL,
      password: PASSWORD,
      acteurId,
    },
    { ip: "127.0.0.1", userAgent: "smoke" },
  );
  check("inscription acceptée", registered.ok, registered);
  if (!registered.ok) throw new Error("Inscription échouée.");
  const newUserId = registered.userId;

  const duplicate = await register(
    { firstName: "Test", lastName: "Doublon", username: USERNAME, email: `other_${EMAIL}`, password: PASSWORD, acteurId },
    {},
  );
  check("identifiant en doublon refusé", !duplicate.ok && duplicate.fieldErrors.username !== undefined, duplicate);

  const pendingLogin = await login({ identifier: USERNAME, password: PASSWORD });
  check("connexion refusée tant que non validé", !pendingLogin.ok && pendingLogin.code === "account_pending", pendingLogin);

  const member = await postgresAccountRepository.findById(newUserId);
  check("rôle forcé à membre", member?.role.code === "membre", member?.role);
  check("compte en attente", member?.status === "en_attente", member?.status);

  console.log("\n[3] Validation / suspension / réactivation");
  check("validation du compte", (await users.confirm(admin, newUserId)).ok);
  const memberLogin = await login({ identifier: USERNAME, password: PASSWORD });
  check("connexion après validation", memberLogin.ok, memberLogin);

  check("auto-suspension interdite", !(await users.suspend(admin, admin.id)).ok);
  check("suspension", (await users.suspend(admin, newUserId)).ok);
  check(
    "session révoquée après suspension",
    memberLogin.ok ? (await resolveSession(memberLogin.token)) === null : false,
  );
  check(
    "connexion refusée après suspension",
    !(await login({ identifier: USERNAME, password: PASSWORD })).ok,
  );
  check("réactivation", (await users.reactivate(admin, newUserId)).ok);

  console.log("\n[4] Réinitialisation et changement de mot de passe");
  check("réinitialisation admin", (await users.resetPassword(admin, newUserId, "Temp2026!")).ok);
  check("mot de passe temporaire accepté", (await login({ identifier: USERNAME, password: "Temp2026!" })).ok);

  const account = await postgresAccountRepository.findAccountById(newUserId);
  check("renouvellement demandé", account?.mustChangePassword === true);

  const changed = await changeOwnPassword(newUserId, {
    currentPassword: "Temp2026!",
    newPassword: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
  });
  check("changement par l'utilisateur", changed.ok, changed);
  check("nouveau mot de passe opérationnel", (await login({ identifier: USERNAME, password: NEW_PASSWORD })).ok);
  check("ancien mot de passe refusé", !(await login({ identifier: USERNAME, password: "Temp2026!" })).ok);

  console.log("\n[5] Anti-bruteforce");
  const victim = `brute_${suffix}`;
  for (let i = 0; i < 5; i += 1) {
    await login({ identifier: victim, password: "mauvais" });
  }
  const blocked = await login({ identifier: victim, password: "mauvais" });
  check("blocage après 5 échecs", !blocked.ok && blocked.code === "too_many_attempts", blocked);

  console.log("\n[6] Acteurs");
  const siteRow = (
    await query<{ id: number }>("select id from sites where code = 'CENTRAL'")
  ).rows[0];
  if (!siteRow) throw new Error("Site CENTRAL absent.");
  const createdActeur = await acteurs.create(admin, {
    abbreviation: `SMK${suffix.slice(-4).toUpperCase()}`,
    name: `Organisme smoke ${suffix}`,
    type: "ASSOCIATION",
    siteId: siteRow.id,
  });
  check("création d'un organisme", createdActeur.ok, createdActeur);
  if (createdActeur.ok) {
    check("organisme directement validé", (await postgresActeurAdminRepository.findStatus(createdActeur.id)) === "valide");
    check("rejet avec motif", (await acteurs.reject(admin, createdActeur.id, "Test de rejet")).ok);
    check("revalidation possible", (await acteurs.validate(admin, createdActeur.id)).ok);
  }

  console.log("\n[7] Nettoyage");
  if (createdActeur.ok) {
    await query("delete from acteurs where id = $1", [createdActeur.id]);
  }
  await query("delete from users where id = $1", [newUserId]);
  await query("delete from login_attempts where identifier = $1", [victim]);
  console.log("  ✓ données de test supprimées");
}

try {
  await main();
} catch (error) {
  failures += 1;
  console.error("\nERREUR FATALE :", error);
} finally {
  await pool.end();
}

console.log(failures === 0 ? "\n✅ SMOKE TEST OK" : `\n❌ ${failures} échec(s)`);
process.exitCode = failures === 0 ? 0 : 1;
