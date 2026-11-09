import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

// prevent local connection setup from replacing a deliberately configured hosted environment
if (existsSync(".env.local")) {
  console.error(".env.local already exists; leave it intact or remove it explicitly before configuring local Supabase.");
  process.exit(1);
}

// keep privileged cli output in memory rather than printing it or writing it into application settings
const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));

// publish only the nonprivileged connection values needed by the local application
const url = status.API_URL ?? status.api_url;

// support the cli's publishable key while remaining compatible with its local legacy anon key
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY ?? status.anon_key;
if (typeof url !== "string" || typeof key !== "string" || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
  throw new Error("Expected a running local Supabase stack with a nonprivileged key.");
}
writeFileSync(".env.local", `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\n`, { mode: 0o600, flag: "wx" });
console.log("Created ignored .env.local with local URL and nonprivileged key only. No hosted settings were changed.");
