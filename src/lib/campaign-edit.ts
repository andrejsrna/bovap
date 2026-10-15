import { isBg } from "@/lib/body-blocks";

export function campaignDraftInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!name || !subject) return null;
  return {
    name,
    subject,
    title: String(formData.get("title") ?? "").trim(),
    titleBg: isBg(formData.get("titleBg")) ? String(formData.get("titleBg")) : "",
    bodyText: String(formData.get("bodyText") ?? "").trim(),
    cards: String(formData.get("cards") ?? "[]"),
  };
}
