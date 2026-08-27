import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendCampaignTestAction } from "@/lib/actions";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CAMPAIGN_STATUS, formatDate } from "@/lib/utils";
import { parseCampaignCards } from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";

export default async function KampanDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; testSent?: string; testError?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [campaign, testSetting] = await Promise.all([
    prisma.campaign.findUnique({ where: { id }, include: { _count: { select: { recipients: true } } } }),
    prisma.setting.findUnique({ where: { key: "testRecipients" } }),
  ]);
  if (!campaign) notFound();
  const cards = parseCampaignCards(campaign.cards);
  const documents = parseCampaignDocuments(campaign.documents);
  const status = CAMPAIGN_STATUS[campaign.status] ?? { label: campaign.status, tone: "gray" as const };
  const tests = testSetting?.value.split(/[,;\s]+/).filter(Boolean) ?? [];

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/kampane" className="text-sm font-medium text-primary-600">← Späť na kampane</Link><h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{campaign.name}</h1></div><div className="flex items-center gap-3"><Badge tone={status.tone}>{status.label}</Badge>{campaign.status === "DRAFT" ? <ButtonLink href={`/kampane/${campaign.id}/upravit`}>Upraviť obsah</ButtonLink> : null}</div></div>
    {query.saved ? <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Zmeny kampane boli uložené.</p> : null}
    {query.testSent ? <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Test odoslaný na {query.testSent} testovacích adries.</p> : null}
    {query.testError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Test sa neodoslal. Skontrolujte testovacie adresy a odosielateľa v Nastaveniach.</p> : null}
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card><CardBody><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Predmet emailu</p><p className="mt-1 font-medium text-gray-900">{campaign.subject}</p><p className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Obsah</p><h2 className="mt-2 text-xl font-semibold text-gray-900">{campaign.title}</h2><p className="mt-3 whitespace-pre-line leading-7 text-gray-700">{campaign.bodyText}</p><div className="mt-6 space-y-3">{cards.map((card) => <div key={card.url} className="rounded-xl border border-gray-200 p-4"><a href={card.url} className="font-semibold text-primary-700" target="_blank">{card.title}</a><p className="mt-1 text-sm leading-6 text-gray-600">{card.description}</p></div>)}</div>{documents.length ? <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prílohy kampane</p><ul className="mt-3 space-y-2">{documents.map((document) => <li key={document.url}><a href={document.url} target="_blank" className="text-sm font-semibold text-primary-700 underline">PDF · {document.name}</a></li>)}</ul></div> : null}</CardBody></Card>
      <div className="space-y-4"><Card><CardBody><h2 className="font-semibold text-gray-900">Kontrola pred odoslaním</h2><p className="mt-2 text-sm leading-6 text-gray-600">Najprv otvorte náhľad. Potom pošlite test iba na uložené testovacie adresy.</p><div className="mt-4 grid gap-2"><ButtonLink href={`/kampane/${campaign.id}/nahlad`} target="_blank">Otvoriť email náhľad</ButtonLink><form action={sendCampaignTestAction}><input type="hidden" name="id" value={campaign.id} /><button disabled={!tests.length} className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-700 disabled:cursor-not-allowed disabled:opacity-50">Poslať test ({tests.length})</button></form></div></CardBody></Card><Card><CardBody><h2 className="font-semibold text-gray-900">Ostré odoslanie</h2><p className="mt-2 text-sm leading-6 text-gray-600">Zatiaľ vypnuté. Ďalší krok vyberie skupiny a pred potvrdením zobrazí presný počet príjemcov.</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Karty</dt><dd>{cards.length}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Vytvorená</dt><dd>{formatDate(campaign.createdAt)}</dd></div></dl></CardBody></Card></div>
    </div>
  </div>;
}
