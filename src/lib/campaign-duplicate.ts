export type CampaignDuplicateSource = {
  name: string;
  subject: string;
  title: string;
  bodyText: string;
  cards: string;
  documents: string;
  imageUrl: string | null;
};

/** Obsahová kópia je vždy nový koncept bez príjemcov a štatistík. */
export function duplicateCampaignData(source: CampaignDuplicateSource) {
  return {
    name: `Kópia – ${source.name}`,
    subject: source.subject,
    title: source.title,
    bodyText: source.bodyText,
    cards: source.cards,
    documents: source.documents,
    imageUrl: source.imageUrl,
    status: "DRAFT" as const,
  };
}
