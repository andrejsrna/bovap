import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { retrySendAction, sendCampaignTestAction } from "@/lib/actions";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CAMPAIGN_STATUS, formatDate } from "@/lib/utils";
import { parseCampaignCards } from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";
import { sanitizeEmailHtml } from "@/lib/rich-text";

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)} %`;
}

export default async function KampanDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; testSent?: string; testError?: string; sending?: string; sendError?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [campaign, testSetting, groups, totalActive, byStatus, problemRecipients] = await Promise.all([
    prisma.campaign.findUnique({ where: { id }, include: { _count: { select: { recipients: true } } } }),
    prisma.setting.findUnique({ where: { key: "testRecipients" } }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      include: { subscribers: { where: { subscriber: { status: "ACTIVE" } } } },
    }),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.campaignRecipient.groupBy({ by: ["status"], where: { campaignId: id }, _count: true }),
    prisma.campaignRecipient.findMany({
      where: { campaignId: id, status: { in: ["FAILED", "BOUNCED"] } },
      include: { subscriber: { select: { email: true } } },
      orderBy: { id: "asc" },
      take: 20,
    }),
  ]);
  if (!campaign) notFound();
  const cards = parseCampaignCards(campaign.cards);
  const documents = parseCampaignDocuments(campaign.documents);
  const status = CAMPAIGN_STATUS[campaign.status] ?? { label: campaign.status, tone: "gray" as const };
  const tests = testSetting?.value.split(/[,;\s]+/).filter(Boolean) ?? [];
  const countOf = (s: string) => byStatus.find((r) => r.status === s)?._count ?? 0;
  const pendingCount = countOf("PENDING");
  const sentTotal = countOf("SENT") + countOf("DELIVERED") + countOf("OPENED") + countOf("CLICKED");
  const showResults = campaign.status !== "DRAFT";

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/kampane" className="text-sm font-medium text-primary-600">← Späť na kampane</Link><h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{campaign.name}</h1></div><div className="flex items-center gap-3"><Badge tone={status.tone}>{status.label}</Badge>{campaign.status === "DRAFT" ? <ButtonLink href={`/kampane/${campaign.id}/upravit`}>Upraviť obsah</ButtonLink> : null}</div></div>
    {query.saved ? <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Zmeny kampane boli uložené.</p> : null}
    {query.testSent ? <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Test odoslaný na {query.testSent} testovacích adries.</p> : null}
    {query.testError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Test sa neodoslal. Skontrolujte testovacie adresy a odosielateľa v Nastaveniach.</p> : null}
    {query.sending ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Newsletter sa odosiela. Po dokončení sa stav zmení na „Odoslaná„.</p> : null}
    {query.sendError === "1" ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Odoslanie nebolo spustené. Skontrolujte Brevo kľúč a nastavenia odosielateľa.</p> : null}
    {query.sendError === "2" ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Pre vybraný cieľ nie sú žiadni aktívni odberatelia.</p> : null}
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card><CardBody><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Predmet emailu</p><p className="mt-1 font-medium text-gray-900">{campaign.subject}</p><p className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Obsah</p><h2 className="mt-2 text-xl font-semibold text-gray-900">{campaign.title}</h2><p className="mt-3 leading-7 text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(campaign.bodyText) }} /><div className="mt-6 space-y-3">{cards.map((card) => <div key={card.url} className="rounded-xl border border-gray-200 p-4"><a href={card.url} className="font-semibold text-primary-700" target="_blank">{card.title}</a><p className="mt-1 text-sm leading-6 text-gray-600">{card.description}</p></div>)}</div>{documents.length ? <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prílohy kampane</p><ul className="mt-3 space-y-2">{documents.map((document) => <li key={document.url}><a href={document.url} target="_blank" className="text-sm font-semibold text-primary-700 underline">PDF · {document.name}</a></li>)}</ul></div> : null}</CardBody></Card>
      <div className="space-y-4"><Card><CardBody><h2 className="font-semibold text-gray-900">Kontrola pred odoslaním</h2><p className="mt-2 text-sm leading-6 text-gray-600">Najprv otvorte náhľad. Potom pošlite test iba na uložené testovacie adresy.</p><div className="mt-4 grid gap-2"><ButtonLink href={`/kampane/${campaign.id}/nahlad`} target="_blank">Otvoriť email náhľad</ButtonLink><form action={sendCampaignTestAction}><input type="hidden" name="id" value={campaign.id} /><button disabled={!tests.length} className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-700 disabled:cursor-not-allowed disabled:opacity-50">Poslať test ({tests.length})</button></form></div></CardBody></Card><Card><CardBody><h2 className="font-semibold text-gray-900">Ostré odoslanie</h2>{campaign.status === "DRAFT" ? (<><p className="mt-2 text-sm leading-6 text-gray-600">Vyberte príjemcov. Pred odoslaním sa zobrazí potvrdenie s presným počtom.</p><form method="get" action={`/kampane/${campaign.id}/odoslat`} className="mt-3 space-y-2"><label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"><input type="checkbox" name="allActive" value="1" className="accent-primary-600" />Všetci aktívni odberatelia ({totalActive})</label>{groups.map((g) => <label key={g.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"><input type="checkbox" name="groups" value={g.name} className="accent-primary-600" />{g.name} ({g.subscribers.length})</label>)}<button className="mt-3 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Odoslať newsletter</button></form></>) : campaign.status === "SENDING" ? (<><p className="mt-2 text-sm leading-6 text-gray-600">Newsletter sa odosiela. Fronta je uložená v databáze – po výpadku ju obnovíte tlačidlom nižšie.</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Odoslané Brevu</dt><dd>{campaign.recipientsSent} / {campaign.recipientsTarget}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Čaká vo fronte</dt><dd>{pendingCount}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Zlyhané</dt><dd>{campaign.recipientsFailed}</dd></div></dl><form action={retrySendAction} className="mt-4"><input type="hidden" name="id" value={campaign.id} /><button className="w-full rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-700">Spracovať frontu znova</button></form></>) : campaign.status === "SENT" ? (<><p className="mt-2 text-sm leading-6 text-gray-600">Newsletter bol odoslaný. Detaily doručenia nájdete vo výsledkoch nižšie.</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Odoslané Brevu</dt><dd>{campaign.recipientsSent} / {campaign.recipientsTarget}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Doručené</dt><dd>{campaign.statsDelivered}</dd></div>{campaign.sentAt ? <div className="flex justify-between"><dt className="text-gray-500">Odoslaná</dt><dd>{formatDate(campaign.sentAt)}</dd></div> : null}</dl></>) : (<><p className="mt-2 text-sm leading-6 text-gray-600">Odoslanie zlyhalo. Skontrolujte Brevo nastavenia a skúste znova.</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Odoslané Brevu</dt><dd>{campaign.recipientsSent} / {campaign.recipientsTarget}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Zlyhané</dt><dd>{campaign.recipientsFailed}</dd></div></dl></>)}<dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Karty</dt><dd>{cards.length}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Vytvorená</dt><dd>{formatDate(campaign.createdAt)}</dd></div></dl></CardBody></Card></div>
    </div>
    {showResults ? <Card><CardBody>
      <h2 className="font-semibold text-gray-900">Výsledky kampane</h2>
      <p className="mt-1 text-sm text-gray-500">„Odoslané Brevu“ = Brevo API prijalo správu. „Doručené / bounce / otvorenia / kliknutia“ prichádzajú z Brevo webhooku.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.recipientsTarget}</b><span className="text-xs text-gray-500">cieľ</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{sentTotal}</b><span className="text-xs text-gray-500">odoslané Brevu</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.statsDelivered}</b><span className="text-xs text-gray-500">doručené ({pct(campaign.statsDelivered, sentTotal)})</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-red-700">{campaign.recipientsFailed}</b><span className="text-xs text-gray-500">zlyhané pri odoslaní</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.statsSoftBounced + campaign.statsHardBounced}</b><span className="text-xs text-gray-500">bounce celkom (soft {campaign.statsSoftBounced} / hard {campaign.statsHardBounced})</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.statsOpened}</b><span className="text-xs text-gray-500">otvorenia ({pct(campaign.statsOpened, campaign.statsDelivered || sentTotal)})</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.statsClicked}</b><span className="text-xs text-gray-500">kliknutia ({pct(campaign.statsClicked, campaign.statsDelivered || sentTotal)})</span></div>
        <div className="rounded-lg border border-gray-200 px-3 py-3"><b className="block text-xl text-gray-900">{campaign.statsUnsub}</b><span className="text-xs text-gray-500">odhlásenia</span></div>
      </div>
      {problemRecipients.length ? <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Problémoví príjemcovia (max 20)</p><ul className="mt-3 space-y-2 text-sm">{problemRecipients.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"><span className="font-medium text-gray-900">{r.subscriber.email}</span><span className="text-xs text-gray-500">{r.status}{r.error ? ` · ${r.error}` : ""}</span></li>)}</ul></div> : null}
    </CardBody></Card> : null}
  </div>;
}
