"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";

export default function SettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <ErrorAlert message={state.error} /> : null}

      <Field>
        <Label htmlFor="senderName">Meno odosielateľa</Label>
        <Input
          id="senderName"
          name="senderName"
          defaultValue={initial.senderName ?? ""}
        />
      </Field>

      <Field>
        <Label htmlFor="senderEmail">Email odosielateľa</Label>
        <Input
          id="senderEmail"
          name="senderEmail"
          type="email"
          defaultValue={initial.senderEmail ?? ""}
        />
      </Field>

      <Field>
        <Label htmlFor="footerText">Pätička emailu</Label>
        <Textarea
          id="footerText"
          name="footerText"
          rows={3}
          defaultValue={initial.footerText ?? ""}
        />
        <p className="text-xs text-gray-400">
          Do pätičky sa automaticky pridá odkaz na odhlásenie.
        </p>
      </Field>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Ukladám…" : "Uložiť nastavenia"}
        </Button>
      </div>
    </form>
  );
}
