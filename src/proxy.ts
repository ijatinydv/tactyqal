import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "@/lib/env/public";

// create a fresh continuation response with caching disabled for auth-sensitive routes
function noStoreResponse(request: NextRequest): NextResponse {
  const response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

// refresh supabase cookies without treating the proxy as the authorization boundary
export async function proxy(request: NextRequest) {
  const config = getPublicSupabaseConfig();
  let response = noStoreResponse(request);
  if (!config) return response;

  const supabase = createServerClient(config.supabaseUrl, config.publishableKey, {
    cookies: {
      // provide the latest incoming cookie jar to session refresh
      getAll() {
        return request.cookies.getAll();
      },
      // make refreshed cookies visible to both the route render and browser response
      setAll(cookiesToSet, headersToSet) {
        const previousHeaders = new Headers(response.headers);
        const previousCookies = response.cookies.getAll();
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        const refreshedResponse = noStoreResponse(request);
        previousHeaders.forEach((value, name) => refreshedResponse.headers.set(name, value));
        for (const cookie of previousCookies) refreshedResponse.cookies.set(cookie);
        response = refreshedResponse;
        for (const [name, value] of Object.entries(headersToSet)) response.headers.set(name, value);
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}

// refresh cookies only for editor routes and the uncached sign-in form
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
