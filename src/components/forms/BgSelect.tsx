"use client";

import { BG_COLORS } from "@/lib/body-blocks";

/** Výber farby pozadia z pevnej palety; prázdna hodnota = bez pozadia. */
export default function BgSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
    Farba pozadia
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm" style={value ? { backgroundColor: value } : undefined}>
      <option value="">Bez pozadia</option>
      {BG_COLORS.map((color) => <option key={color.value} value={color.value} style={{ backgroundColor: color.value }}>{color.label}</option>)}
    </select>
  </label>;
}
