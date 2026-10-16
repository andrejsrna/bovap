import type { CSSProperties } from "react";

// Jediný zdroj typografie: editor, detail kampane aj emailová šablóna musia vyzerať rovnako.
export const EMAIL_FONT_STACK = "Arial,Helvetica,sans-serif";
export const EMAIL_PROSE = {
  // width = šírka textu v emaile (620 px šablóna mínus okraje), aby sa riadky lámali rovnako.
  body: { fontSize: 16, lineHeight: 1.4, color: "#435967", width: 536 },
  card: { fontSize: 15, lineHeight: 1.4, color: "#526574", width: 434 },
} as const;
export const EMAIL_SPACING = { paragraph: 6, list: 6, listIndent: 22, listItem: 2 } as const;

export type EmailProseKind = keyof typeof EMAIL_PROSE;

/** Inline štýl pre admin (React) – rovnaké hodnoty ako v emaile. */
export function emailProseStyle(kind: EmailProseKind): CSSProperties {
  const prose = EMAIL_PROSE[kind];
  return { fontFamily: EMAIL_FONT_STACK, fontSize: `${prose.fontSize}px`, lineHeight: prose.lineHeight, color: prose.color, textAlign: "justify", textAlignLast: "left", overflowWrap: "anywhere", maxWidth: `${prose.width}px` };
}

/** Okraje odsekov a zoznamov v admine – zhodné s inline štýlmi v emaile. */
export const EMAIL_PROSE_CLASS =
  "[&_p]:mt-0 [&_p]:mb-[6px] [&_ul]:mt-0 [&_ul]:mb-[6px] [&_ul]:pl-[22px] [&_ul]:list-disc [&_ol]:mt-0 [&_ol]:mb-[6px] [&_ol]:pl-[22px] [&_ol]:list-decimal [&_li]:mt-0 [&_li]:mb-[2px] [&_a]:text-[#1f668d] [&_a]:underline";
