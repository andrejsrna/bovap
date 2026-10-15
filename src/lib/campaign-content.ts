import { sanitizeEmailHtml } from "@/lib/rich-text";
import { EMAIL_FONT_STACK, EMAIL_PROSE, EMAIL_SPACING } from "@/lib/email-prose";
import { blockBoxStyle, isBg, parseBodyBlocks, styleToCss } from "@/lib/body-blocks";

export type CampaignFile = { type: "PDF"; size: number };
export type CampaignCard = { title: string; description: string; url: string; file?: CampaignFile; bg?: string };

// 372720 → „364 KB“, 1572864 → „1,5 MB“; neznáma veľkosť → prázdny reťazec.
export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

const isPdfUrl = (url: string) => /\.pdf(?:$|[?#])/i.test(url);

// Odseky a zoznamy dostanú explicitné okraje: emailové programy majú vlastné predvolby a rozťahujú ich.
const emailHtml = (value: string) =>
  sanitizeEmailHtml(value)
    .replace(/<p>/g, `<p style="margin:0 0 ${EMAIL_SPACING.paragraph}px">`)
    .replace(/<(ul|ol)>/g, `<$1 style="margin:0 0 ${EMAIL_SPACING.list}px;padding-left:${EMAIL_SPACING.listIndent}px">`)
    .replace(/<li>/g, `<li style="margin:0 0 ${EMAIL_SPACING.listItem}px">`)
    .replace(/<a href="([^"]*)">/g, '<a href="$1" style="color:#1f668d;text-decoration:underline">');

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] ?? char));

export function parseCampaignCards(value: string): CampaignCard[] {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const card = item as Record<string, unknown>;
      const title = typeof card.title === "string" ? card.title.trim() : "";
      const description = typeof card.description === "string" ? card.description.trim() : "";
      const url = typeof card.url === "string" ? card.url.trim() : "";
      const file = card.file as Record<string, unknown> | undefined;
      const info: CampaignFile | null = file && file.type === "PDF" && typeof file.size === "number" && file.size > 0 ? { type: "PDF", size: file.size } : null;
      return title && (url.startsWith("http") || !url) ? [{ title, description, url, ...(info && { file: info }), ...(isBg(card.bg) && { bg: card.bg }) }] : [];
    });
  } catch { return []; }
}

export function renderCampaignHtml({ title, titleBg = "", bodyText, cards, documents = [], unsubscribeUrl }: {
  title: string; titleBg?: string; bodyText: string; cards: CampaignCard[]; documents?: { name: string; url: string }[]; unsubscribeUrl: string;
}) {
  // Úvod je jeden alebo viac textových blokov; farebný blok je v bunke s pozadím (funguje aj v Outlooku).
  const proseStyle = `color:${EMAIL_PROSE.body.color};font-size:${EMAIL_PROSE.body.fontSize}px;line-height:${EMAIL_PROSE.body.lineHeight};text-align:justify;text-align-last:left`;
  const bodyBlocks = parseBodyBlocks(bodyText).map((block) => ({ box: blockBoxStyle(block.bg, block.border), html: emailHtml(block.html) })).filter((block) => block.html);
  const body = bodyBlocks.map((block, index) => {
    const text = `<div style="${proseStyle};margin:0">${block.html}</div>`;
    const inner = Object.keys(block.box).length ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="${styleToCss(block.box)}">${text}</td></tr></table>` : text;
    return `<div style="margin:0 0 ${index === bodyBlocks.length - 1 ? 26 : 14}px">${inner}</div>`;
  }).join("");
  // Logo musí byť verejná absolútna URL (súbor z public/), nie cesta za prihlásením.
  const logoUrl = `${(process.env.APP_URL ?? "https://mail.bovap.sk").replace(/\/$/, "")}/bovap-logo.png`;
  // Titulok s pozadím: h1 v bunke tabuľky (rovnako ako farebné bloky textu), odsadenie dole prenesie obal.
  const titleBox = styleToCss(blockBoxStyle(titleBg, ""));
  const heading = `<h1 class="hero-title" style="color:#173b52;font-size:32px;line-height:1.2;letter-spacing:-.5px;margin:${titleBox ? "0" : "0 0 18px"}">${escapeHtml(title)}</h1>`;
  const headingHtml = titleBox ? `<div style="margin:0 0 18px"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="${titleBox}">${heading}</td></tr></table></div>` : heading;
  const cardAction = (card: CampaignCard) => {
    if (!card.url) return "";
    const href = escapeHtml(card.url);
    // Odkaz ostáva rovnaký pre všetky karty; PDF len doplní typ a veľkosť za text.
    let meta = "";
    if (card.file || isPdfUrl(card.url)) {
      const size = card.file ? formatFileSize(card.file.size) : "";
      meta = `<span style="color:#6c7d88;font-weight:400"> · PDF${size ? `, ${size}` : ""}</span>`;
    }
    return `<a href="${href}" style="color:#1f668d;font-size:14px;font-weight:700;text-decoration:none">Pozrieť podrobnosti&nbsp; →${meta}</a>`;
  };
  const items = cards.map((card, index) => `<tr><td style="padding:0 0 14px"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${card.bg ?? "#ffffff"};border:1px solid #dce4ed;border-radius:14px"><tr><td width="48" valign="top" style="padding:22px 0 18px 20px"><div style="width:28px;height:28px;border-radius:14px;background:#e8eff5;color:#1f4e6d;font-size:13px;font-weight:700;line-height:28px;text-align:center">${index + 1}</div></td><td style="padding:20px 20px 18px 12px">${card.url ? `<a href="${escapeHtml(card.url)}" style="color:#173b52;font-size:18px;font-weight:700;line-height:1.35;text-decoration:none">${escapeHtml(card.title)}</a>` : `<span style="color:#173b52;font-size:18px;font-weight:700;line-height:1.35">${escapeHtml(card.title)}</span>`}${card.description ? `<div style="color:${EMAIL_PROSE.card.color};font-size:${EMAIL_PROSE.card.fontSize}px;line-height:${EMAIL_PROSE.card.lineHeight};text-align:justify;text-align-last:left;margin:6px 0 10px">${emailHtml(card.description)}</div>` : ""}${cardAction(card)}</td></tr></table></td></tr>`).join("");
  const documentItems = documents.map((document) => `<tr><td style="padding:0 0 8px"><a href="${escapeHtml(document.url)}" style="display:block;border:1px solid #dce4ed;border-radius:10px;color:#1f668d;font-size:14px;font-weight:700;padding:13px 15px;text-decoration:none">PDF · ${escapeHtml(document.name)}</a></td></tr>`).join("");
  return `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:22px!important;padding-right:22px!important}.hero-title{font-size:28px!important}.footer-pad{padding-left:22px!important;padding-right:22px!important}}</style></head><body style="margin:0;padding:0;background:#eef3f6;color:#173b52;font-family:${EMAIL_FONT_STACK};-webkit-text-size-adjust:100%"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef3f6"><tr><td align="center" style="padding:30px 12px"><table class="email-shell" width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 620px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(23,59,82,.08)"><tr><td style="background:#ffffff;padding:20px 32px;border-bottom:4px solid #173b52"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td><img src="${logoUrl}" alt="Občianske združenie BOVAP" width="130" style="display:block;width:130px;height:auto;border:0"></td><td align="right" style="color:#1f668d;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase">Praktické informácie</td></tr></table></td></tr><tr><td class="email-pad" style="padding:38px 42px 26px"><div style="width:44px;height:4px;background:#53a0c9;border-radius:2px;margin-bottom:20px"></div>${headingHtml}${body}${items ? `<p style="color:#6c7d88;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px">Prehľad</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items}</table>` : ""}${documentItems ? `<p style="color:#6c7d88;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:24px 0 12px">Dokumenty na stiahnutie</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation">${documentItems}</table>` : ""}</td></tr><tr><td class="footer-pad" style="padding:22px 42px 26px;background:#f6f8fa;border-top:1px solid #e4ebf0"><p style="color:#62737e;font-size:12px;line-height:1.65;margin:0">Túto správu ste dostali od občianskeho združenia OZ BOVAP.</p><p style="margin:8px 0 0"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#3d6177;font-size:12px;text-decoration:underline">Odhlásiť sa z odberu</a></p></td></tr></table><p style="color:#8796a0;font-size:11px;line-height:1.5;margin:16px 0 0">OZ BOVAP · informačný email</p></td></tr></table></body></html>`;
}
