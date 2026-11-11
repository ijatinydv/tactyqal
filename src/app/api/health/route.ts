import { dataResponse } from "@/lib/http/json";

// keep uptime checks dependency-free and fast
export const dynamic = "force-dynamic";

export async function GET() {
  return dataResponse({ status: "ok", timestamp: new Date().toISOString() });
}
