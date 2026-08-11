export const SUBSCRIBER_STATUSES = [
  "ACTIVE",
  "UNSUBSCRIBED",
  "BOUNCED",
  "COMPLAINED",
] as const;

export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export function normalizeSubscriberQuery(input: Record<string, string | undefined>) {
  const status = SUBSCRIBER_STATUSES.includes(input.status as SubscriberStatus)
    ? (input.status as SubscriberStatus)
    : undefined;
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);

  return {
    q: (input.q ?? "").trim().toLowerCase(),
    page,
    status,
    skupina: input.skupina?.trim() || undefined,
  };
}

export function subscriberHref(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== 1) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/odberatelia?${query}` : "/odberatelia";
}
