"use client";

import { useActionState, useState } from "react";
import { createCampaignAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";

type Card = { title: string; description: string; url: string };
const blank = (): Card => ({ title: "", description: "", url: "" });

export default function NewCampaignForm() {
  const [state, formAction, pending] = useActionState(createCampaignAction, undefined);
  const [cards, setCards] = useState<Card[]>([blank()]);
  const update = (index: number, key: keyof Card, value: string) => setCards((items) => items.map((card, i) => i === index ? { ...card, [key]: value } : card));

  return <form action={formAction} encType="multipart/form-data" className="space-y-6">
    {state?.error ? <ErrorAlert message={state.error} /> : null}
    <input type="hidden" name="cards" value={JSON.stringify(cards.filter((card) => card.title || card.description || card.url))} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field><Label htmlFor="name">Názov kampane</Label><Input id="name" name="name" placeholder="napr. Septembrová výzva" required /></Field>
      <Field><Label htmlFor="subject">Predmet emailu</Label><Input id="subject" name="subject" placeholder="Čo príjemca uvidí v schránke" required /></Field>
    </div>
    <Field><Label htmlFor="title">Hlavný titulok</Label><Input id="title" name="title" placeholder="Dôležité informácie pre samosprávy" required /></Field>
    <Field><Label htmlFor="bodyText">Úvodný text</Label><Textarea id="bodyText" name="bodyText" rows={5} placeholder="Krátke oslovenie a kontext správy…" /></Field>

    <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
      <div className="mb-4"><h2 className="font-semibold text-gray-900">Obsahové karty</h2><p className="mt-1 text-sm text-gray-500">Každá karta má názov, krátky popis a odkaz. V emaile dostane vlastné tlačidlo.</p></div>
      <div className="space-y-4">
        {cards.map((card, index) => <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><strong className="text-sm text-gray-700">Karta {index + 1}</strong>{cards.length > 1 ? <button type="button" onClick={() => setCards((items) => items.filter((_, i) => i !== index))} className="text-sm font-medium text-red-600 hover:text-red-700">Odstrániť</button> : null}</div>
          <div className="space-y-3"><Input value={card.title} onChange={(e) => update(index, "title", e.target.value)} placeholder="Názov karty" /><Textarea value={card.description} onChange={(e) => update(index, "description", e.target.value)} rows={3} placeholder="Stručný popis" /><Input value={card.url} onChange={(e) => update(index, "url", e.target.value)} type="url" placeholder="https://… alebo PDF nižšie" /><div><Label htmlFor={`pdf-${index}`} className="text-xs">PDF dokument (voliteľné, max. 10 MB)</Label><Input id={`pdf-${index}`} name={`pdf-${index}`} type="file" accept="application/pdf,.pdf" /></div></div>
        </div>)}
      </div>
      <button type="button" onClick={() => setCards((items) => [...items, blank()])} className="mt-4 text-sm font-semibold text-primary-700 hover:text-primary-800">+ Pridať kartu</button>
    </section>
    <div className="flex justify-end border-t border-gray-100 pt-5"><Button type="submit" disabled={pending}>{pending ? "Ukladám…" : "Uložiť a otvoriť náhľad"}</Button></div>
  </form>;
}
