export type CampaignCard = { title: string; description: string; url: string };

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
      return title && (url.startsWith("http") || !url) ? [{ title, description, url }] : [];
    });
  } catch { return []; }
}

export function renderCampaignHtml({ title, bodyText, cards, documents = [], unsubscribeUrl }: {
  title: string; bodyText: string; cards: CampaignCard[]; documents?: { name: string; url: string }[]; unsubscribeUrl: string;
}) {
  const body = escapeHtml(bodyText).replace(/\n/g, "<br>");
  const items = cards.map((card, index) => `<tr><td style="padding:0 0 14px"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #dce4ed;border-radius:14px"><tr><td width="48" valign="top" style="padding:22px 0 18px 20px"><div style="width:28px;height:28px;border-radius:14px;background:#e8eff5;color:#1f4e6d;font-size:13px;font-weight:700;line-height:28px;text-align:center">${index + 1}</div></td><td style="padding:20px 20px 18px 12px"><a href="${escapeHtml(card.url)}" style="color:#173b52;font-size:18px;font-weight:700;line-height:1.35;text-decoration:none">${escapeHtml(card.title)}</a>${card.description ? `<p style="color:#526574;font-size:15px;line-height:1.65;margin:8px 0 14px">${escapeHtml(card.description)}</p>` : ""}<a href="${escapeHtml(card.url)}" style="color:#1f668d;font-size:14px;font-weight:700;text-decoration:none">Pozrieť podrobnosti&nbsp; →</a></td></tr></table></td></tr>`).join("");
  const documentItems = documents.map((document) => `<tr><td style="padding:0 0 8px"><a href="${escapeHtml(document.url)}" style="display:block;border:1px solid #dce4ed;border-radius:10px;color:#1f668d;font-size:14px;font-weight:700;padding:13px 15px;text-decoration:none">PDF · ${escapeHtml(document.name)}</a></td></tr>`).join("");
  return `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:22px!important;padding-right:22px!important}.hero-title{font-size:28px!important}.footer-pad{padding-left:22px!important;padding-right:22px!important}}</style></head><body style="margin:0;padding:0;background:#eef3f6;color:#173b52;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef3f6"><tr><td align="center" style="padding:30px 12px"><table class="email-shell" width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 620px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(23,59,82,.08)"><tr><td style="background:#173b52;padding:25px 32px"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:.2px">OZ BOVAP</td><td align="right" style="color:#c7d9e5;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase">Praktické informácie</td></tr></table></td></tr><tr><td class="email-pad" style="padding:38px 42px 26px"><div style="width:44px;height:4px;background:#53a0c9;border-radius:2px;margin-bottom:20px"></div><h1 class="hero-title" style="color:#173b52;font-size:32px;line-height:1.2;letter-spacing:-.5px;margin:0 0 18px">${escapeHtml(title)}</h1>${body ? `<p style="color:#435967;font-size:16px;line-height:1.7;margin:0 0 26px">${body}</p>` : ""}${items ? `<p style="color:#6c7d88;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">Prehľad</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items}</table>` : ""}${documentItems ? `<p style="color:#6c7d88;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:24px 0 12px">Dokumenty na stiahnutie</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation">${documentItems}</table>` : ""}</td></tr><tr><td class="footer-pad" style="padding:22px 42px 26px;background:#f6f8fa;border-top:1px solid #e4ebf0"><p style="color:#62737e;font-size:12px;line-height:1.65;margin:0">Túto správu ste dostali od občianskeho združenia OZ BOVAP.</p><p style="margin:8px 0 0"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#3d6177;font-size:12px;text-decoration:underline">Odhlásiť sa z odberu</a></p></td></tr></table><p style="color:#8796a0;font-size:11px;line-height:1.5;margin:16px 0 0">OZ BOVAP · informačný email</p></td></tr></table></body></html>`;
}
