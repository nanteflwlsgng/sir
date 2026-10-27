/**
 * Test end-to-end du parcours d'authentification via CDP (Edge headless).
 * Couvre : connexion, session, déconnexion, garde d'accès, inscription,
 * validation par un administrateur, connexion du nouveau compte.
 *
 * Usage : node --env-file=.env.local scripts/e2e-auth.mjs
 */
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import process from "node:process";
import pg from "pg";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9223;
const PROFILE = "C:/Users/manda/AppData/Local/Temp/opencode/edge-sir-e2e";
const BASE = "http://localhost:3000";

const SUFFIX = Date.now().toString(36);
const NEW_USER = {
  firstName: "Agent",
  lastName: "Test",
  username: `agent_${SUFFIX}`,
  email: `agent_${SUFFIX}@example.test`,
  password: "Agent2026!",
};

const browser = spawn(
  EDGE,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-extensions",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws;
let failures = 0;

function check(label, condition, detail) {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    failures += 1;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(fn, timeoutMs = 30_000, intervalMs = 300) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      // retry
    }
    await sleep(intervalMs);
  }
  return null;
}

async function connect() {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return response.ok ? response.json() : null;
  });
  if (!version) throw new Error("Edge CDP indisponible.");

  const targetResponse = await fetch(
    `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`${BASE}/connexion`)}`,
    { method: "PUT" },
  );
  const target = await targetResponse.json();

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  return function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
}

async function main() {
  const send = await connect();

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? "Erreur JS");
    }
    return result.result.value;
  };

  const currentPath = () => evaluate("location.pathname");
  const bodyText = () => evaluate("document.body.innerText");
  const goto = async (path) => {
    await send("Page.navigate", { url: `${BASE}${path}` });
    await waitFor(() => evaluate("document.readyState === 'complete'"));
  };

  const login = async (identifier, password) => {
    await goto("/connexion");
    await waitFor(() => evaluate("!!document.getElementById('identifier')"));
    await evaluate(`
      (() => {
        document.getElementById('identifier').value = ${JSON.stringify(identifier)};
        document.getElementById('password').value = ${JSON.stringify(password)};
        document.querySelector('form').requestSubmit();
        return true;
      })()
    `);
  };

  console.log("\n[1] Connexion administrateur");
  await login("admin", "Admin@2026!");
  const adminPath = await waitFor(async () => {
    const value = await currentPath();
    return value === "/tableau-de-bord" ? value : null;
  }, 40_000);
  check("redirection vers le tableau de bord", adminPath === "/tableau-de-bord", adminPath);

  const dashboardText = await bodyText();
  check("accueil personnalisé", dashboardText.includes("Bonjour"));
  check("périmètre MEDD", dashboardText.includes("MEDD"));
  check("aucun hash de mot de passe dans le DOM", !dashboardText.includes("scrypt"));
  check(
    "cookie de session inaccessible en JS (HttpOnly)",
    (await evaluate("document.cookie.includes('sir_session')")) === false,
  );

  console.log("\n[2] Déconnexion et garde d'accès");
  await evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('Déconnexion'),
      );
      button?.click();
      return true;
    })()
  `);
  const backToLogin = await waitFor(async () => ((await currentPath()) === "/connexion" ? true : null));
  check("retour à la connexion", backToLogin === true);

  await goto("/tableau-de-bord");
  const guarded = await waitFor(async () => ((await currentPath()) === "/connexion" ? true : null));
  check("accès protégé redirigé", guarded === true);

  console.log("\n[3] Inscription publique");
  await goto("/inscription");
  await waitFor(() => evaluate("!!document.getElementById('firstName')"));
  await evaluate(`
    (() => {
      const set = (id, value) => { document.getElementById(id).value = value; };
      set('firstName', ${JSON.stringify(NEW_USER.firstName)});
      set('lastName', ${JSON.stringify(NEW_USER.lastName)});
      set('username', ${JSON.stringify(NEW_USER.username)});
      set('email', ${JSON.stringify(NEW_USER.email)});
      set('password', ${JSON.stringify(NEW_USER.password)});
      set('confirmPassword', ${JSON.stringify(NEW_USER.password)});
      const select = document.getElementById('acteurId');
      select.selectedIndex = 1;
      document.querySelector('form').requestSubmit();
      return true;
    })()
  `);

  const registered = await waitFor(async () => {
    const path = await currentPath();
    return path === "/connexion" ? true : null;
  }, 40_000);
  check("redirection après inscription", registered === true);
  check("message de confirmation affiché", (await bodyText()).includes("Demande enregistrée"));

  console.log("\n[4] Compte en attente");
  await login(NEW_USER.username, NEW_USER.password);
  const pendingMessage = await waitFor(async () => {
    const text = await bodyText();
    return text.includes("en attente de validation") ? true : null;
  }, 20_000);
  check("connexion refusée et message explicite", pendingMessage === true);
  check("toujours sur la page de connexion", (await currentPath()) === "/connexion");

  console.log("\n[5] Validation par l'administrateur");
  await login("admin", "Admin@2026!");
  await waitFor(async () => ((await currentPath()) === "/tableau-de-bord" ? true : null), 40_000);
  await goto("/administration/utilisateurs");
  await waitFor(() => evaluate("!!document.querySelector('tbody tr')"));

  const clicked = await evaluate(`
    (() => {
      const row = Array.from(document.querySelectorAll('tbody tr')).find((r) =>
        (r.innerText || '').includes(${JSON.stringify(NEW_USER.username)}),
      );
      if (!row) return false;
      const button = Array.from(row.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('Valider'),
      );
      if (!button) return false;
      button.click();
      return true;
    })()
  `);
  check("bouton de validation trouvé", clicked === true);

  const validated = await waitFor(async () => {
    const text = await bodyText();
    return text.includes("Le compte a été validé") ? true : null;
  }, 30_000);
  check("confirmation de validation", validated === true);

  console.log("\n[6] Connexion du nouveau compte");
  await evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('Déconnexion'),
      );
      button?.click();
      return true;
    })()
  `);
  await waitFor(async () => ((await currentPath()) === "/connexion" ? true : null));

  await login(NEW_USER.username, NEW_USER.password);
  const memberPath = await waitFor(async () => {
    const value = await currentPath();
    return value === "/tableau-de-bord" ? value : null;
  }, 40_000);
  check("accès autorisé après validation", memberPath === "/tableau-de-bord", memberPath);

  const memberText = await bodyText();
  check("rôle Membre appliqué", memberText.includes("Membre"));
  check("pas d'accès au menu Utilisateurs", !memberText.includes("Utilisateurs"));
}

try {
  await main();
} catch (error) {
  failures += 1;
  console.error("\nERREUR FATALE :", error);
} finally {
  try {
    ws?.close();
  } catch {}
  browser.kill();
  await sleep(500);
  await rm(PROFILE, { recursive: true, force: true }).catch(() => {});

  if (process.env.DATABASE_URL) {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const { rows } = await client.query("select id from users where username = $1", [NEW_USER.username]);
      if (rows[0]) {
        await client.query("delete from users where id = $1", [rows[0].id]);
        console.log("  (compte de test supprimé)");
      }
    } catch (error) {
      console.error("Nettoyage impossible :", error.message);
    } finally {
      await client.end().catch(() => {});
    }
  }
}

console.log(failures === 0 ? "\n✅ E2E OK" : `\n❌ ${failures} échec(s)`);
process.exitCode = failures === 0 ? 0 : 1;
