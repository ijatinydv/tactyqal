import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";

// keep operational test credentials out of browser bundles and normal application environment settings
export function localAuthAdmin() {
  const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })) as Record<string, string>;
  if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) throw new Error("Auth integration tests require local Supabase.");
  return createClient(status.API_URL, status.SERVICE_ROLE_KEY ?? status.SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

// give each browser run isolated identities rather than sharing checked in editor passwords
export async function createAuthFixture(role: "editor" | "viewer") {
  const admin = localAuthAdmin();
  const password = randomBytes(24).toString("base64url");
  const email = `${role}-${randomBytes(8).toString("hex")}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: "editor" } });
  if (error || !data.user) throw new Error("Could not create the local Auth fixture.");
  if (role === "editor") {
    execFileSync("docker", ["exec", "supabase_db_tactyqal", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `CALL private.bootstrap_editor('${data.user.id}'::uuid);`], { stdio: ["ignore", "pipe", "pipe"] });
  }
  return { id: data.user.id, email, password };
}

// model a database expired session rather than assuming a removed browser cookie proves expiration checks
export function expireLocalSessions(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Expected an Auth user UUID.");
  execFileSync("docker", ["exec", "supabase_db_tactyqal", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `UPDATE auth.sessions SET not_after = now() - interval '1 minute' WHERE user_id = '${id}'::uuid; UPDATE auth.refresh_tokens SET revoked = true WHERE user_id = '${id}';`], { stdio: ["ignore", "pipe", "pipe"] });
}

// force a genuinely expired signed local access token so the browser must confront its revoked refresh session
export async function expireBrowserAccessToken(context: BrowserContext) {
  const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })) as Record<string, string>;
  if (!status.JWT_SECRET || !["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) throw new Error("Expected local JWT test signing configuration.");
  const cookies = (await context.cookies()).filter(cookie => /^sb-.*-auth-token(?:\.\d+)?$/.test(cookie.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (!cookies.length) throw new Error("Expected an authenticated browser session.");
  const baseName = cookies[0].name.replace(/\.\d+$/, "");
  const encoded = cookies.map(cookie => cookie.value).join("");
  const session = JSON.parse(Buffer.from(encoded.replace(/^base64-/, ""), "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url").toString("utf8"));
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const validPayload = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  const validSignature = createHmac("sha256", status.JWT_SECRET).update(`${header}.${validPayload}`).digest("base64url");
  const valid = await localAuthAdmin().auth.getUser(`${header}.${validPayload}.${validSignature}`);
  if (valid.error || !valid.data.user) throw new Error("Control token failed: this test cannot establish a signed expired-token boundary.");
  payload.exp = Math.floor(Date.now() / 1000) - 3600;
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", status.JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  session.access_token = `${header}.${body}.${signature}`;
  const expired = await localAuthAdmin().auth.getUser(session.access_token);
  if (!expired.error || !/expir/i.test(expired.error.message)) throw new Error("The fixture was not rejected specifically as an expired JWT.");
  session.expires_at = payload.exp;
  const replacement = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  await context.clearCookies({ name: /^sb-.*-auth-token(?:\.\d+)?$/ });
  const chunks = replacement.match(/.{1,3000}/g) ?? [];
  for (const [index, value] of chunks.entries()) {
    await context.addCookies([{ ...cookies[0], name: chunks.length === 1 ? baseName : `${baseName}.${index}`, value }]);
  }
}
