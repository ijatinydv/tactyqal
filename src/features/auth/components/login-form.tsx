"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "../actions";
import type { LoginActionState } from "../types";

// collect invited credentials with accessible pending and field-error feedback
export function LoginForm({ notice }: { notice: LoginActionState | null }) {
  const [state, formAction, isPending] = useActionState(loginAction, notice ?? {
    email: "",
    message: null,
    messageKind: null,
    fieldErrors: {},
  });

  return (
    <form action={formAction} key={state.email} className="mt-8 space-y-5">
      {state.message ? (
        <p role={state.messageKind === "error" ? "alert" : "status"} aria-live={state.messageKind === "error" ? "assertive" : "polite"} className="rounded-lg border border-control-border bg-white p-4 text-sm leading-6 text-ink">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold">Email address</label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          defaultValue={state.email}
          aria-invalid={Boolean(state.fieldErrors.email)}
          aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
        />
        {state.fieldErrors.email ? <p id="email-error" role="alert" className="text-sm text-danger">{state.fieldErrors.email}</p> : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={1024}
          aria-invalid={Boolean(state.fieldErrors.password)}
          aria-describedby={state.fieldErrors.password ? "password-error" : undefined}
        />
        {state.fieldErrors.password ? <p id="password-error" role="alert" className="text-sm text-danger">{state.fieldErrors.password}</p> : null}
      </div>
      <Button type="submit" className="w-full" disabled={isPending} aria-disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm leading-6 text-muted" aria-live="polite">
        {isPending ? "Checking your invited editor account." : "This workspace is invitation-only. No account can be created here."}
      </p>
    </form>
  );
}
