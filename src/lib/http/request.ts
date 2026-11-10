import { HttpError } from "./error";

// compare the browser origin to the externally addressed host rather than nexts internal listener url
export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const received = new URL(origin);
    const internal = new URL(request.url);
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || internal.host;
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || internal.protocol.replace(":", "");
    if (!["http", "https"].includes(protocol) || received.username || received.password) return false;
    return received.origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}

// bound mutation payloads before parsing their json representation
export async function readJsonBody(request: Request, maxBytes = 262144): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "INVALID_JSON", "A JSON request body is required");

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "BODY_TOO_LARGE", "Request body exceeds the allowed size");
    }
    chunks.push(value);
  }

  try {
    const body = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must contain valid JSON");
  }
}
