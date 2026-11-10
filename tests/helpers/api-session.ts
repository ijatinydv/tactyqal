import { createServerClient } from "@supabase/ssr";
import { execFileSync } from "node:child_process";

// test direct api authorisation with valid viewer cookies rather than relying on the login form to sign viewers out
export async function apiSessionCookie(fixture: { email: string; password: string }) {
  const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })) as Record<string, string>;
  if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) throw new Error("API fixtures require the isolated local stack.");
  const jar = new Map<string, string>();
  const client = createServerClient(status.API_URL, status.ANON_KEY ?? status.PUBLISHABLE_KEY, {
    cookies: {
      // isolate each test session from developer and browser fixture cookies
      getAll() { return [...jar].map(([name, value]) => ({ name, value })); },
      // retain the same chunked cookie representation used by the actual ssr application
      setAll(values) { for (const cookie of values) jar.set(cookie.name, cookie.value); },
    },
  });
  const { error } = await client.auth.signInWithPassword(fixture);
  if (error) throw new Error("Could not authenticate the local API fixture.");
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
