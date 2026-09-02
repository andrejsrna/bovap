import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendCampaignAction } from "@/lib/actions";
import { subscriberGroupInput } from "@/lib/subscriber-query";
import { targetWhere } from "@/lib/campaign-send";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default async function OdoslatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ groups?: string; allActive?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== "DRAFT") redirect(`/kampane/${id}`);

  const allActive = q.allActive === "1";
  const groupsRaw = Array.isArray(q.groups) ? q.groups.join(",") : q.groups ?? "";
  const groupNames = subscriberGroupInput(groupsRaw);;
  if (!allActive && !groupNames.length) redirect(`/kampane/${id}`);

  const subscribers = await prisma.subscriber.findMany({
    where: targetWhere(allActive, groupNames),
    select: { id: true },
  });
  const count = subscribers.length;
  if (!count) notFound();;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Link href={`/kampane/${id}`} className="text-sm font-medium text-primary-600">← Späť</Link>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Odoslať newsletter</h1>
      <Card><CardBody className="space-y-4">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Kampaň</dt><dd className="font-medium text-gray-900">{campaign.name}</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Predmet</dt><dd className="font-medium text-gray-900">{campaign.subject}</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Príjemcovia</dt><dd className="font-semibold text-gray-900">{count} aktívnych</dd></div>
          {!allActive ? <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Skupiny</dt><dd className="font-medium text-gray-900">{groupNames.join(", ")}</dd></div> : null}
        </dl>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Odoslaním sa z vášho mesačného limitu použije {count} kreditov. Newsletter bude doručený odberateľom cez Brevo.</p>
        <form action={sendCampaignAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="allActive" value={allActive ? "1" : ""} />
          <input type="hidden" name="groups" value={groupNames.join(", ")} />
          <Button type="submit" variant="danger">Áno, odoslať newsletter</Button>
          <ButtonLink href={`/kampane/${id}`} variant="secondary">Zrušiť</ButtonLink>
        </form>
      </CardBody></Card>
    </div>
  );
}