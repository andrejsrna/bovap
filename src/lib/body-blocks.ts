// Textové bloky úvodu: každý môže mať farbu pozadia z pevnej palety (nikdy voľný CSS reťazec).
export const BG_COLORS = [
  { value: "#eaf3fa", label: "Svetlomodrá" },
  { value: "#fff4d6", label: "Svetložltá" },
  { value: "#e6f4ea", label: "Svetlozelená" },
  { value: "#fde8e8", label: "Svetločervená" },
  { value: "#f1ecf8", label: "Svetlofialová" },
  { value: "#eeeeee", label: "Svetlosivá" },
] as const;

export const isBg = (value: unknown): value is string => BG_COLORS.some((color) => color.value === value);

export type BodyBlock = { html: string; bg: string };

/** Padding farebného bloku v emaile aj v editore (aby sa riadky lámali rovnako). */
export const BLOCK_PAD = { y: 12, x: 16 } as const;

/** bodyText je buď čistý HTML (jeden blok, ako doteraz), alebo JSON pole `{html, bg}`. */
export function parseBodyBlocks(value: string): BodyBlock[] {
  if (value.trimStart().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length && parsed.every((item) => item && typeof item === "object" && typeof (item as { html?: unknown }).html === "string")) {
        return (parsed as { html: string; bg?: unknown }[]).map((item) => ({ html: item.html, bg: isBg(item.bg) ? item.bg : "" }));
      }
    } catch { /* obyčajný text, ktorý len začína hranatou zátvorkou */ }
  }
  return [{ html: value, bg: "" }];
}

/** Jeden blok bez farby ostáva čistý HTML: staré kampane, duplikácia a odosielanie fungujú bez zmeny. */
export function serializeBodyBlocks(blocks: BodyBlock[]): string {
  const kept = blocks.filter((block) => block.html.trim()).map((block) => ({ html: block.html, bg: isBg(block.bg) ? block.bg : "" }));
  if (kept.length === 0) return "";
  if (kept.length === 1 && !kept[0].bg) return kept[0].html;
  return JSON.stringify(kept);
}
