import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteSubscriberAction, updateSubscriberAction } from "@/lib/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUBSCRIBER_SOURCE, SUBSCRIBER_STATUS, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function SubscriberDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const [subscriber, groups, sp] = await Promise.all([
    prisma.subscriber.findUnique({ where: { id }, include: { groups: { include: { group: true } } } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    searchParams,
  ]);
  if (!subscriber) notFound();
  const selectedGroups = subscriber.groups.map(({ group }) => group.name).join(", ");

  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-center justify-between gap-3"><div><Link href="/odberatelia" className="text-sm font-medium text-primary-600 hover:underline">← Späť na odoberateľov</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Upraviť odoberateľa</h1></div><form action={deleteSubscriberAction}><input type="hidden" name="id" value={subscriber.id} /><Button type="submit" variant="danger" size="sm">Odstrániť</Button></form></div>
    {sp.saved === "1" && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Zmeny boli uložené.</div>}
    <Card className="p-5 sm:p-6"><form action={updateSubscriberAction} className="space-y-5"><input type="hidden" name="id" value={subscriber.id} />
      <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium text-gray-700">Email<input name="email" type="email" defaultValue={subscriber.email} required className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></label><label className="grid gap-2 text-sm font-medium text-gray-700">Meno<input name="name" defaultValue={subscriber.name ?? ""} className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></label></div>
      <label className="grid gap-2 text-sm font-medium text-gray-700">Stav<select name="status" defaultValue={subscriber.status} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100">{Object.entries(SUBSCRIBER_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium text-gray-700">Skupiny <span className="font-normal text-gray-500">Oddeľte čiarkou. Nový názov vytvorí skupinu.</span><input name="groups" defaultValue={selectedGroups} list="groups" placeholder="napr. Západ, Mestá" className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><datalist id="groups">{groups.map(group => <option key={group.id} value={group.name} />)}</datalist></label>
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500"><div>Zdroj: <b className="font-medium text-gray-700">{SUBSCRIBER_SOURCE[subscriber.source] ?? subscriber.source}</b></div><div className="mt-1">Pridaný: {formatDate(subscriber.createdAt)} · Upravený: {formatDate(subscriber.updatedAt)}</div></div>
      <div className="flex justify-end gap-3"><ButtonLink href="/odberatelia" variant="secondary">Zrušiť</ButtonLink><Button type="submit">Uložiť zmeny</Button></div>
    </form></Card>
  </div>;
}
