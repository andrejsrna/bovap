import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createGroupAction, deleteGroupAction, saveTestRecipientsAction } from "@/lib/actions";
import SettingsForm from "@/components/forms/SettingsForm";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

type Props = { searchParams: Promise<{ testSaved?: string; groupSaved?: string; groupDeleted?: string; groupError?: string }> };

export default async function NastaveniaPage({ searchParams }: Props) {
  const [settings, groups, sp] = await Promise.all([
    prisma.setting.findMany(),
    prisma.group.findMany({ include: { _count: { select: { subscribers: true } } }, orderBy: { name: "asc" } }),
    searchParams,
  ]);
  const initial = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const testCount = initial.testRecipients ? initial.testRecipients.split(/\s*,\s*/).filter(Boolean).length : 0;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight text-gray-900">Nastavenia</h1><p className="mt-1 text-sm text-gray-500">Odosielateľ, testovacie adresy a skupiny príjemcov.</p></div>
    {(sp.testSaved || sp.groupSaved || sp.groupDeleted) && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Zmeny boli uložené.</div>}
    {sp.groupError === "occupied" && <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">Skupinu nemožno zmazať, kým obsahuje odoberateľov. Najprv ich upravte alebo presuňte.</div>}

    <Card><CardBody><h2 className="text-base font-semibold text-gray-900">Odosielateľ a pätička</h2><p className="mt-1 mb-5 text-sm text-gray-500">Údaje použité pri každej kampani. Odhlasovací odkaz pridá systém automaticky.</p><SettingsForm initial={initial} /></CardBody></Card>

    <Card><CardBody><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold text-gray-900">Testovacie emaily</h2><p className="mt-1 text-sm text-gray-500">Test kampane pôjde len na tieto adresy. Nezaradia sa medzi odoberateľov ani do štatistík kampane.</p></div><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{testCount} adries</span></div><form action={saveTestRecipientsAction} className="mt-5 space-y-3"><textarea name="testRecipients" rows={3} defaultValue={initial.testRecipients ?? ""} placeholder="andrej@example.sk, kolega@example.sk" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><p className="text-xs text-gray-400">Oddeľte čiarkou, bodkočiarkou alebo novým riadkom. Duplicitné a neplatné adresy sa neuložia.</p><div className="flex justify-end"><Button type="submit">Uložiť testovacie adresy</Button></div></form></CardBody></Card>

    <Card><CardBody><h2 className="text-base font-semibold text-gray-900">Skupiny príjemcov</h2><p className="mt-1 text-sm text-gray-500">Skupiny slúžia na cielenie kampaní, napr. Západ, Stred, Východ, mestá alebo konkrétna výzva.</p><form action={createGroupAction} className="mt-5 flex flex-col gap-3 sm:flex-row"><input name="name" required maxLength={80} placeholder="Názov novej skupiny" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><Button type="submit">Vytvoriť skupinu</Button></form><div className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-200">{groups.length === 0 ? <p className="p-4 text-sm text-gray-400">Zatiaľ žiadne skupiny.</p> : groups.map(group => <div key={group.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><Link href={`/odberatelia?skupina=${encodeURIComponent(group.name)}`} className="font-medium text-gray-900 hover:text-primary-600">{group.name}</Link><p className="text-xs text-gray-500">{group._count.subscribers} odoberateľov</p></div><form action={deleteGroupAction}><input type="hidden" name="id" value={group.id} /><Button type="submit" variant="ghost" size="sm" disabled={group._count.subscribers > 0} title={group._count.subscribers > 0 ? "Najprv odpojte odoberateľov" : "Zmazať prázdnu skupinu"}>Zmazať</Button></form></div>)}</div></CardBody></Card>

    <Card><CardBody><h2 className="text-base font-semibold text-gray-900">Doručiteľnosť</h2><p className="mt-1 text-sm text-gray-500">Pred prvým ostrým odoslaním overíme doménu bovap.sk v Brevo a nastavíme SPF, DKIM a DMARC. Testovaciu kampaň vždy najprv odošlite na adresy vyššie.</p></CardBody></Card>
  </div>;
}
