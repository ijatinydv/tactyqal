import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { loadEnvFile } from "node:process";
import { localAdmin, promoteLocalEditor } from "./local-auth.mjs";

// use ignored local public settings without printing connection values or fixture credentials
try { loadEnvFile(".env.local"); } catch { throw new Error("Configure the local stack with pnpm env:local before integration tests."); }

// keep persisted api tests on the disposable local application rather than a customer deployment
const baseURL = process.env.BLOG_API_BASE_URL ?? "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname)) throw new Error("Integration fixtures require a local application URL.");

// create an isolated confirmed identity for the actual authenticated http requests
const admin = localAdmin();

// generate an undeliverable fixture identity instead of using shared administrator credentials
const email = `api-${randomBytes(8).toString("hex")}@example.invalid`;

// generate a fresh password for each run and retain it only in child process memory
const password = randomBytes(24).toString("base64url");

// provide the integration suite with a real least privilege identity before its trusted role grant
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error || !data.user) throw new Error("Could not provision the isolated API fixture.");
// propagate failed persisted checks even when fixture cleanup succeeds
let exitCode = 1;
try {
  promoteLocalEditor(data.user.id);
  const result = spawnSync(process.execPath, ["--test", "tests/integration/blog-api.test.ts"], {
    stdio: "inherit",
    env: { ...process.env, BLOG_API_BASE_URL: baseURL, BLOG_API_EDITOR_EMAIL: email, BLOG_API_EDITOR_PASSWORD: password },
  });
  exitCode = result.status ?? 1;
} finally {
  await admin.from("posts").delete().eq("author_id", data.user.id);
  await admin.auth.admin.deleteUser(data.user.id);
}
process.exitCode = exitCode;
