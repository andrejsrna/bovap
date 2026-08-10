export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// ---- Stavové štítky (slovensky) ----

export const CAMPAIGN_STATUS: Record<
  string,
  { label: string; tone: "gray" | "yellow" | "green" | "red" | "primary" }
> = {
  DRAFT: { label: "Koncept", tone: "gray" },
  SENDING: { label: "Odosiela sa", tone: "yellow" },
  SENT: { label: "Odoslaná", tone: "green" },
  FAILED: { label: "Chyba", tone: "red" },
};

export const SUBSCRIBER_STATUS: Record<
  string,
  { label: string; tone: "gray" | "yellow" | "green" | "red" | "primary" }
> = {
  ACTIVE: { label: "Aktívny", tone: "green" },
  UNSUBSCRIBED: { label: "Odhlásený", tone: "gray" },
  BOUNCED: { label: "Bounce", tone: "red" },
  COMPLAINED: { label: "Sťažnosť", tone: "yellow" },
};

export const SUBSCRIBER_SOURCE: Record<string, string> = {
  IMPORT: "Import",
  MANUAL: "Ručne",
  WEB: "Webový formulár",
};
