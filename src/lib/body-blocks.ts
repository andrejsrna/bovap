// Textové bloky úvodu: každý môže mať farbu pozadia a orámovanie z pevnej palety (nikdy voľný CSS reťazec).
export const BG_COLORS = [
  { value: "#eaf3fa", label: "Svetlomodrá" },
  { value: "#fff4d6", label: "Svetložltá" },
  { value: "#e6f4ea", label: "Svetlozelená" },
  { value: "#fde8e8", label: "Svetločervená" },
  { value: "#f1ecf8", label: "Svetlofialová" },
  { value: "#eeeeee", label: "Svetlosivá" },
] as const;

export const BORDERS = [
  { value: "thin", label: "Tenký rámik" },
  { value: "accent", label: "Farebný rámik" },
  { value: "left", label: "Pruh vľavo" },
] as const;

const ACCENT = "#1f668d";

export const isBg = (value: unknown): value is string => BG_COLORS.some((color) => color.value === value);
export const isBorder = (value: unknown): value is string => BORDERS.some((border) => border.value === value);

export type BodyBlock = { html: string; bg: string; border: string };

/** Padding rámčeka v emaile aj v editore (aby sa riadky lámali rovnako). */
export const BLOCK_PAD = { y: 12, x: 16 } as const;

/** CSS rámčeka bloku (camelCase pre React; email ho cez styleToCss prevedie na kebab-case). */
export function blockBoxStyle(bg: string, border: string): Record<string, string> {
  if (!isBg(bg) && !isBorder(border)) return {};
  const style: Record<string, string> = {};
  if (isBg(bg)) style.background = bg;
  if (border === "thin") style.border = "1px solid #cfd8e2";
  if (border === "accent") style.border = `1px solid ${ACCENT}`;
  if (border === "left") { style.border = "1px solid #dce4ed"; style.borderLeft = `4px solid ${ACCENT}`; }
  style.padding = `${BLOCK_PAD.y}px ${BLOCK_PAD.x}px`;
  style.borderRadius = "10px";
  return style;
}

export const styleToCss = (style: Record<string, string>) =>
  Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}:${value}`).join(";");

/** Koľko px šírky zaberie rámček (padding + okraje) – text vnútri je o toľko užší. */
export function blockInset(bg: string, border: string) {
  if (!isBg(bg) && !isBorder(border)) return 0;
  return 2 * BLOCK_PAD.x + (border === "left" ? 5 : border ? 2 : 0);
}

/** bodyText je buď čistý HTML (jeden blok, ako doteraz), alebo JSON pole `{html, bg, border}`. */
export function parseBodyBlocks(value: string): BodyBlock[] {
  if (value.trimStart().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length && parsed.every((item) => item && typeof item === "object" && typeof (item as { html?: unknown }).html === "string")) {
        return (parsed as { html: string; bg?: unknown; border?: unknown }[]).map((item) => ({ html: item.html, bg: isBg(item.bg) ? item.bg : "", border: isBorder(item.border) ? item.border : "" }));
      }
    } catch { /* obyčajný text, ktorý len začína hranatou zátvorkou */ }
  }
  return [{ html: value, bg: "", border: "" }];
}

/** Jeden blok bez farby a rámika ostáva čistý HTML: staré kampane, duplikácia a odosielanie fungujú bez zmeny. */
export function serializeBodyBlocks(blocks: BodyBlock[]): string {
  const kept = blocks.filter((block) => block.html.trim()).map((block) => ({ html: block.html, bg: isBg(block.bg) ? block.bg : "", border: isBorder(block.border) ? block.border : "" }));
  if (kept.length === 0) return "";
  if (kept.length === 1 && !kept[0].bg && !kept[0].border) return kept[0].html;
  return JSON.stringify(kept);
}
