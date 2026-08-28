import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddSubscriberForm from "@/components/forms/AddSubscriberForm";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatDate, SUBSCRIBER_SOURCE, SUBSCRIBER_STATUS } from "@/lib/utils";
import { normalizeSubscriberQuery, subscriberHref } from "@/lib/subscriber-query";

const PAGE_SIZE = 50;
type Params = { q?: string; page?: string; status?: string; skupina?: string; deleted?: string };

export default async function OdoberateliaPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = normalizeSubscriberQuery(await searchParams);
  const where = {
    ...(params.q ? { OR: [{ email: { contains: params.q, mode: "insensitive" as const } }, { name: { contains: params.q, mode: "insensitive" as const } }] } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.skupina ? { groups: { some: { group: { name: params.skupina } } } } : {}),
  };
  const [groups, subscribers, total, activeCount, unsubscribedCount] = await Promise.all([
    prisma.group.findMany({ include: { _count: { select: { subscribers: true } } }, orderBy: { name: "asc" } }),
    prisma.subscriber.findMany({ where, include: { groups: { include: { group: true } } }, orderBy: { createdAt: "desc" }, skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.subscriber.count({ where }),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (patch: Record<string, string | number | undefined>) => subscriberHref({ q: params.q, status: params.status, skupina: params.skupina, page: params.page, ...patch });

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-gray-900">Odoberatelia</h1><p className="mt-1 text-sm text-gray-500">Správa príjemcov, skupín a súhlasov.</p></div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg border border-gray-200 bg-white px-3 py-2"><b className="block text-base text-gray-900">{activeCount}</b>aktívnych</div><div className="rounded-lg border border-gray-200 bg-white px-3 py-2"><b className="block text-base text-gray-900">{unsubscribedCount}</b>odhlásených</div><div className="rounded-lg border border-gray-200 bg-white px-3 py-2"><b className="block text-base text-gray-900">{groups.length}</b>skupín</div></div>
    </div>
    <Card className="p-4 sm:p-6"><AddSubscriberForm groups={groups.map((g) => g.name)} /></Card>
    {((await searchParams).deleted === "1") && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Odoberateľ bol odstránený.</div>}
    <Card className="p-4 sm:p-5">
      <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" method="GET">
        <input name="q" defaultValue={params.q} placeholder="Hľadať email alebo meno…" className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"><option value="">Všetky stavy</option>{Object.entries(SUBSCRIBER_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select>
        <button className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">Hľadať</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2"><Link href={href({ skupina: undefined, page: 1 })} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", !params.skupina ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-600")}>Všetky <span className="ml-1 text-gray-400">{total}</span></Link>{groups.map(g => <Link key={g.id} href={href({ skupina: g.name, page: 1 })} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", params.skupina === g.name ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-600")}>{g.name} <span className="ml-1 text-gray-400">{g._count.subscribers}</span></Link>)}</div>
    </Card>
    <div className="flex items-center justify-between"><p className="text-sm text-gray-500">{total ? <>Zobrazuje sa <b>{(params.page - 1) * PAGE_SIZE + 1}–{Math.min(params.page * PAGE_SIZE, total)}</b> z <b>{total}</b> výsledkov</> : "Žiadne výsledky"}</p>{(params.q || params.status || params.skupina) && <Link href="/odberatelia" className="text-sm font-medium text-primary-600 hover:underline">Zrušiť filtre</Link>}</div>
    {subscribers.length === 0 ? <Card className="border border-dashed border-gray-200 bg-transparent p-16 text-center text-sm text-gray-400">Pre tento filter sa nenašli odoberatelia.</Card> : <Card className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm text-gray-500"><thead className="bg-gray-50 text-gray-900"><tr><th className="px-5 py-3 font-medium">Odoberateľ</th><th className="px-5 py-3 font-medium">Stav</th><th className="px-5 py-3 font-medium">Skupiny</th><th className="px-5 py-3 font-medium">Zdroj</th><th className="px-5 py-3 font-medium">Pridaný</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-gray-100">{subscribers.map(s => { const state = SUBSCRIBER_STATUS[s.status] ?? { label: s.status, tone: "gray" as const }; return <tr key={s.id} className="hover:bg-gray-50"><td className="px-5 py-3"><b className="block text-gray-900">{s.email}</b>{s.name && <span className="text-xs">{s.name}</span>}</td><td className="px-5 py-3"><Badge tone={state.tone}>{state.label}</Badge></td><td className="px-5 py-3"><div className="flex flex-wrap gap-1">{s.groups.map(g => <Link key={g.groupId} href={href({ skupina: g.group.name, page: 1 })} className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-700">{g.group.name}</Link>) || <span>—</span>}</div></td><td className="px-5 py-3">{SUBSCRIBER_SOURCE[s.source] ?? s.source}</td><td className="px-5 py-3 whitespace-nowrap">{formatDate(s.createdAt)}</td><td className="px-5 py-3 text-right"><ButtonLink href={`/odberatelia/${s.id}`} size="sm" variant="secondary">Upraviť</ButtonLink></td></tr>})}</tbody></table></Card>}
    {pages > 1 && <nav className="flex items-center justify-center gap-2" aria-label="Stránkovanie"><ButtonLink href={href({ page: Math.max(1, params.page - 1) })} size="sm" variant="secondary" aria-disabled={params.page === 1} className={params.page === 1 ? "pointer-events-none opacity-40" : ""}>Predchádzajúca</ButtonLink><span className="px-3 text-sm text-gray-600">Strana {params.page} z {pages}</span><ButtonLink href={href({ page: Math.min(pages, params.page + 1) })} size="sm" variant="secondary" aria-disabled={params.page === pages} className={params.page === pages ? "pointer-events-none opacity-40" : ""}>Ďalšia</ButtonLink></nav>}
  </div>;
}
