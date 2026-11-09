import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { localAdmin, promoteLocalEditor } from "./local-auth.mjs";

// keep disposable editor credentials in ignored private workspace state rather than source code or logs
const path = ".hoplite/runtime/local-editor.json";

// restrict account creation and privileged role assignment to the disposable local stack
const admin = localAdmin();
if (existsSync(path)) {
  const existing = JSON.parse(readFileSync(path, "utf8"));
  const result = await admin.auth.admin.getUserById(existing.id);
  if (result.data.user && !result.error) {
    console.log(`A local editor fixture already exists. Credentials remain in ignored ${path}; no password was printed.`);
    process.exit(0);
  }
  console.error(`A stale local fixture file exists after a database reset. Remove ${path} explicitly before creating a new fixture.`);
  process.exit(1);
}

// use an undeliverable synthetic identity so the fixture never contacts an unrelated person
const email = `editor-${randomBytes(5).toString("hex")}@example.invalid`;

// generate a distinct password for each local environment instead of shipping shared administrator credentials
const password = randomBytes(24).toString("base64url");

// create a confirmed local identity without invoking any outbound invitation email
const result = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (result.error || !result.data.user) throw new Error("Could not create the local editor fixture.");
try {
  promoteLocalEditor(result.data.user.id);
  mkdirSync(".hoplite/runtime", { recursive: true, mode: 0o700 });
  writeFileSync(path, JSON.stringify({ id: result.data.user.id, email, password }), { flag: "wx", mode: 0o600 });
  console.log(`Created a disposable local editor. Credentials are stored only in ignored ${path}; no password was printed.`);
} catch {
  await admin.auth.admin.deleteUser(result.data.user.id);
  throw new Error("Local editor provisioning failed; the incomplete identity was removed.");
}
