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
      return title && url.startsWith("http") ? [{ title, description, url }] : [];
    });
  } catch { return []; }
}

export function renderCampaignHtml({ title, bodyText, cards, unsubscribeUrl }: {
  title: string; bodyText: string; cards: CampaignCard[]; unsubscribeUrl: string;
}) {
  const body = escapeHtml(bodyText).replace(/\n/g, "<br>");
  const items = cards.map((card) => `<tr><td style="padding:0 0 16px"><div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px"><a href="${escapeHtml(card.url)}" style="color:#1d4ed8;font-size:18px;font-weight:700;text-decoration:none">${escapeHtml(card.title)}</a>${card.description ? `<p style="color:#4b5563;line-height:1.6;margin:10px 0 0">${escapeHtml(card.description)}</p>` : ""}<p style="margin:14px 0 0"><a href="${escapeHtml(card.url)}" style="display:inline-block;background:#1d4ed8;border-radius:7px;color:#fff;padding:10px 14px;text-decoration:none;font-weight:600">Zobraziť viac</a></p></div></td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:28px 12px"><table width="600" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="background:#1e3a5f;padding:28px 32px;color:#fff"><strong style="font-size:18px">OZ BOVAP</strong></td></tr><tr><td style="padding:32px"><h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">${escapeHtml(title)}</h1>${body ? `<p style="color:#374151;line-height:1.7;margin:0 0 24px">${body}</p>` : ""}<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items}</table></td></tr><tr><td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.6">Túto správu ste dostali od OZ BOVAP. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#4b5563">Odhlásiť sa z odberu</a></td></tr></table></td></tr></table></body></html>`;
}
