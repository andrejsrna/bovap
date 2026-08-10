"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Field, Input, Label } from "@/components/ui/Input";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <ErrorAlert message={state.error} /> : null}

      <Field>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@bovap.sk"
          required
        />
      </Field>

      <Field>
        <Label htmlFor="password">Heslo</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Prihlasujem…" : "Prihlásiť sa"}
      </Button>
    </form>
  );
}
