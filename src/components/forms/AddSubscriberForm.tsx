"use client";

import { useActionState } from "react";
import { addSubscriberAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Field, Input, Label } from "@/components/ui/Input";

export default function AddSubscriberForm() {
  const [state, formAction, pending] = useActionState(
    addSubscriberAction,
    undefined,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {state?.error ? (
        <div className="sm:col-span-3">
          <ErrorAlert message={state.error} />
        </div>
      ) : null}

      <Field>
        <Label htmlFor="sub-email">Email</Label>
        <Input
          id="sub-email"
          name="email"
          type="email"
          placeholder="odoberatel@example.sk"
          required
        />
      </Field>

      <Field>
        <Label htmlFor="sub-name">Meno (voliteľné)</Label>
        <Input id="sub-name" name="name" placeholder="Meno a priezvisko" />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Pridávam…" : "Pridať odoberateľa"}
      </Button>
    </form>
  );
}
