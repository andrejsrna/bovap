import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditCampaignForm from "@/components/forms/EditCampaignForm";
import { prisma } from "@/lib/prisma";
import { parseCampaignCards } from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";
import { Card, CardBody } from "@/components/ui/Card";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  if (campaign.status !== "DRAFT") redirect(`/kampane/${id}`);
  return <div className="mx-auto max-w-3xl space-y-6"><div><Link href={`/kampane/${id}`} className="text-sm font-medium text-primary-600">← Späť na detail</Link><h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Upraviť kampaň</h1><p className="mt-1 text-sm text-gray-500">Zmeny uložte, potom si otvorte email náhľad alebo pošlite test.</p></div><Card><CardBody><EditCampaignForm initial={{ id: campaign.id, name: campaign.name, subject: campaign.subject, title: campaign.title, bodyText: campaign.bodyText, cards: parseCampaignCards(campaign.cards), documents: parseCampaignDocuments(campaign.documents) }} /></CardBody></Card></div>;
}
