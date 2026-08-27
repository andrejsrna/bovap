import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCampaignCards, renderCampaignHtml } from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return new NextResponse("Nenájdené", { status: 404 });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const html = renderCampaignHtml({
    title: campaign.title || campaign.subject,
    bodyText: campaign.bodyText,
    cards: parseCampaignCards(campaign.cards),
    documents: parseCampaignDocuments(campaign.documents),
    unsubscribeUrl: `${appUrl}/odhlasenie/ukazka`,
  });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
