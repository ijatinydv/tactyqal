import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "API docs" };

const endpoints = [
  { method: "GET", path: "/api/posts", auth: false, description: "List published posts. Supports page, pageSize, q, category.", example: "curl https://your-domain/api/posts?page=1&pageSize=10" },
  { method: "GET", path: "/api/posts/:slug", auth: false, description: "Get a single published post by slug.", example: "curl https://your-domain/api/posts/my-post-slug" },
  { method: "GET", path: "/api/categories", auth: false, description: "List all categories.", example: "curl https://your-domain/api/categories" },
  { method: "POST", path: "/api/consultations", auth: false, description: "Submit a consultation request (rate-limited, honeypot-protected).", example: "curl -X POST https://your-domain/api/consultations -H 'Content-Type: application/json' -d '{\"adult_contact_name\":\"...\",\"email\":\"...\"}'" },
  { method: "GET", path: "/api/admin/posts", auth: true, description: "List all posts (draft + published) with search/status filters. Editor session required.", example: "curl https://your-domain/api/admin/posts -H 'Cookie: <session>'" },
  { method: "POST", path: "/api/admin/posts", auth: true, description: "Create a post.", example: "curl -X POST https://your-domain/api/admin/posts -H 'Content-Type: application/json' -d '{...}'" },
  { method: "PATCH", path: "/api/admin/posts/:id", auth: true, description: "Update a post (title, slug, content, status, etc).", example: "curl -X PATCH https://your-domain/api/admin/posts/<id> -d '{...}'" },
  { method: "DELETE", path: "/api/admin/posts/:id", auth: true, description: "Soft-delete a post.", example: "curl -X DELETE https://your-domain/api/admin/posts/<id>" },
  { method: "GET", path: "/api/admin/categories", auth: true, description: "List categories for the editor workspace.", example: "curl https://your-domain/api/admin/categories" },
  { method: "GET", path: "/api/admin/inquiries", auth: true, description: "List consultation requests with status filtering.", example: "curl https://your-domain/api/admin/inquiries" },
  { method: "PATCH", path: "/api/admin/inquiries/:id", auth: true, description: "Update a consultation request's status, or delete it.", example: "curl -X PATCH https://your-domain/api/admin/inquiries/<id> -d '{\"status\":\"reviewed\"}'" },
  { method: "POST", path: "/api/admin/uploads", auth: true, description: "Upload a validated cover image (size/type checked, re-encoded to WebP).", example: "curl -X POST https://your-domain/api/admin/uploads -F file=@cover.png" },
  { method: "GET", path: "/api/health", auth: false, description: "Health check.", example: "curl https://your-domain/api/health" },
];

export default function DocsPage() {
  return (
    <section className="page-container max-w-4xl py-14">
      <p className="eyebrow">API reference</p>
      <h1 className="section-heading mt-4">Endpoints</h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-muted">
        All endpoints return JSON with a consistent envelope: <code>{"{ data }"}</code> on success, or{" "}
        <code>{"{ error: { code, message, fields? } }"}</code> on failure. Admin endpoints require an authenticated
        editor session cookie (Supabase auth) and are rate-limited.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Note: this page lists the real endpoints currently implemented. A fully interactive Swagger/OpenAPI explorer
        (with a generated <code>openapi.json</code> and a &ldquo;Try it out&rdquo; flow) is the planned next step —
        see the README for details.
      </p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">Method</th>
              <th className="py-2 pr-4">Path</th>
              <th className="py-2 pr-4">Auth</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint) => (
              <tr key={`${endpoint.method}-${endpoint.path}`} className="border-b border-border align-top">
                <td className="py-3 pr-4 font-mono text-xs font-semibold text-brand">{endpoint.method}</td>
                <td className="py-3 pr-4 font-mono text-xs">{endpoint.path}</td>
                <td className="py-3 pr-4 text-xs">{endpoint.auth ? "Required" : "Public"}</td>
                <td className="py-3 text-muted">{endpoint.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10 space-y-4">
        {endpoints.map((endpoint) => (
          <pre key={`example-${endpoint.method}-${endpoint.path}`} className="overflow-x-auto rounded-lg bg-ink p-4 text-xs text-white">
            <code>{endpoint.example}</code>
          </pre>
        ))}
      </div>
      <Link href="/" className="mt-10 inline-block text-brand underline">← Back to the homepage</Link>
    </section>
  );
}
