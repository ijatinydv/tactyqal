import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// confine privileged fixture operations to this repository's disposable local supabase stack
export function localAdmin() {
  const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const url = status.API_URL;
  const key = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
  if (typeof url !== "string" || typeof key !== "string" || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
    throw new Error("Fixture provisioning is restricted to a running local Supabase instance.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// keep role grants in the trusted database context rather than exposing a browser callable promotion endpoint
export function promoteLocalEditor(id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Expected an Auth user UUID.");
  execFileSync("docker", ["exec", "supabase_db_tactyqal", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `CALL private.bootstrap_editor('${id}'::uuid);`], { stdio: ["ignore", "pipe", "pipe"] });
}
