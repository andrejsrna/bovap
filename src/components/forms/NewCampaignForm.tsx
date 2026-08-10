"use client";

import { useActionState } from "react";
import { createCampaignAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";

export default function NewCampaignForm() {
  const [state, formAction, pending] = useActionState(
    createCampaignAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <ErrorAlert message={state.error} /> : null}

      <Field>
        <Label htmlFor="name">Názov kampane</Label>
        <Input
          id="name"
          name="name"
          placeholder="napr. Pozvánka na valné zhromaždenie"
          required
        />
      </Field>

      <Field>
        <Label htmlFor="subject">Nadpis (subject emailu)</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Čo uvidí odoberateľ v schránke"
          required
        />
      </Field>

      <Field>
        <Label htmlFor="title">Titulok v tele správy</Label>
        <Input id="title" name="title" placeholder="Hlavný titulok správy" />
      </Field>

      <Field>
        <Label htmlFor="bodyText">Text správy</Label>
        <Textarea
          id="bodyText"
          name="bodyText"
          rows={6}
          placeholder="Sem napíšete text, ktorý odoberatelia uvidia…"
        />
      </Field>

      <Field>
        <Label htmlFor="imageUrl">Fotka (URL)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://… (voliteľné)"
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Ukladám…" : "Uložiť koncept"}
        </Button>
      </div>
    </form>
  );
}
