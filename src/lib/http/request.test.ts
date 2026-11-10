import { describe, expect, it } from "vitest";
import { hasSameOrigin } from "./request";

// preserve csrf protection while deployments forward requests through an internal next listener
 describe("same origin mutation boundary", () => {
  // use the addressed host when the internal framework url differs from the browser origin
  it("accepts the local host header without trusting the internal listener hostname", () => {
    expect(hasSameOrigin(new Request("http://0.0.0.0:3000/api/posts", { headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" } }))).toBe(true);
  });
  // retain the managed hosting origin and protocol through its trusted reverse proxy headers
  it("accepts the hosting proxy origin and rejects unrelated or missing origins", () => {
    const headers = { origin: "https://demo.example", "x-forwarded-host": "demo.example", "x-forwarded-proto": "https" };
    expect(hasSameOrigin(new Request("http://localhost:3000/api/posts", { headers }))).toBe(true);
    expect(hasSameOrigin(new Request("http://localhost:3000/api/posts", { headers: { ...headers, origin: "https://unrelated.example" } }))).toBe(false);
    expect(hasSameOrigin(new Request("http://localhost:3000/api/posts"))).toBe(false);
  });
});
