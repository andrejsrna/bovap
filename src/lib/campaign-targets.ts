// Kampaň sa dá odoslať postupne viacerým skupinám. Skupina, ktorej už odišla, sa zamkne;
// po prvom odoslaní sa zamkne aj „Všetci“ a po odoslaní všetkým sa zamkne úplne všetko.
// Duplicitám pri prekrývaní skupín bráni unikát CampaignRecipient(campaignId, subscriberId).
export const ALL_GROUPS = "*";

export type SentGroup = { name: string; at: string };

export function parseSentGroups(value: string): SentGroup[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SentGroup => !!item && typeof item.name === "string" && typeof item.at === "string").map(({ name, at }) => ({ name, at }));
  } catch {
    return [];
  }
}

export function lockedGroups(sent: SentGroup[]) {
  const everything = sent.some((entry) => entry.name === ALL_GROUPS);
  return { all: sent.length > 0, everything, names: sent.filter((entry) => entry.name !== ALL_GROUPS).map((entry) => entry.name) };
}

/** null = cieľ je povolený; inak dôvod zamietnutia. */
export function checkSendTarget(sent: SentGroup[], allActive: boolean, groupNames: string[]): "empty" | "locked" | "all-locked" | null {
  const locked = lockedGroups(sent);
  if (locked.everything) return "all-locked";
  if (allActive) return locked.all ? "all-locked" : null;
  if (!groupNames.length) return "empty";
  return groupNames.some((name) => locked.names.includes(name)) ? "locked" : null;
}

export function recordSentGroups(sent: SentGroup[], allActive: boolean, groupNames: string[], at: Date): SentGroup[] {
  const stamp = at.toISOString();
  return [...sent, ...(allActive ? [ALL_GROUPS] : groupNames).map((name) => ({ name, at: stamp }))];
}
