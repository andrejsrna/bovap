"use client";

import { useState } from "react";
import RichTextEditor from "@/components/forms/RichTextEditor";
import BgSelect from "@/components/forms/BgSelect";
import { parseBodyBlocks, serializeBodyBlocks, type BodyBlock } from "@/lib/body-blocks";

type Item = BodyBlock & { key: number };

/** Úvodný text ako zoznam blokov; do formulára ide jeden skrytý bodyText (pozri body-blocks.ts). */
export default function BodyBlocksEditor({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [items, setItems] = useState<Item[]>(() => parseBodyBlocks(defaultValue).map((block, key) => ({ ...block, key })));
  const patch = (key: number, change: Partial<BodyBlock>) => setItems((list) => list.map((item) => (item.key === key ? { ...item, ...change } : item)));
  return <div className="space-y-3">
    <input type="hidden" name={name} value={serializeBodyBlocks(items)} />
    {items.map((item, index) => <div key={item.key} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm text-gray-700">Text {index + 1}</strong>
        <div className="flex items-center gap-4">
          <BgSelect value={item.bg} onChange={(bg) => patch(item.key, { bg })} />
          {items.length > 1 ? <button type="button" onClick={() => setItems((list) => list.filter((entry) => entry.key !== item.key))} className="text-sm font-medium text-red-600">Odstrániť</button> : null}
        </div>
      </div>
      <RichTextEditor name={`${name}-block-${item.key}`} defaultValue={item.html} rows={index === 0 ? 5 : 3} bg={item.bg} onChange={(html) => patch(item.key, { html })} />
    </div>)}
    <button type="button" onClick={() => setItems((list) => [...list, { html: "", bg: "", key: Math.max(-1, ...list.map((item) => item.key)) + 1 }])} className="text-sm font-medium text-primary-600">+ Pridať ďalší text</button>
  </div>;
}
