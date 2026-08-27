export type CampaignDocument = { name: string; url: string };

export function parseCampaignDocuments(value: string): CampaignDocument[] {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const url = typeof record.url === "string" ? record.url.trim() : "";
      return name && url.startsWith("http") ? [{ name, url }] : [];
    });
  } catch { return []; }
}

export function documentNames(formData: FormData) {
  return String(formData.get("documentNames") ?? "[]");
}
