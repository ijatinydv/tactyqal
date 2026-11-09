// explain the only required public auth settings without exposing configured values
export function ConfigurationNotice() {
  return (
    <section aria-labelledby="configuration-required" className="mt-8 rounded-xl border border-control-border bg-white p-6">
      <h2 id="configuration-required" className="text-xl font-semibold">Editor authentication needs configuration</h2>
      <p role="status" className="mt-3 text-sm leading-6 text-muted">
        Set valid <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> values to enable invited-editor sign-in.
      </p>
    </section>
  );
}
