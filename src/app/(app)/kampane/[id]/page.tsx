import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { CAMPAIGN_STATUS, formatDate } from "@/lib/utils";

export default async function KampanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { recipients: true } } },
  });
  if (!campaign) notFound();

  const status = CAMPAIGN_STATUS[campaign.status] ?? {
    label: campaign.status,
    tone: "gray" as const,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/kampane"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Späť na kampane
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            {campaign.name}
          </h1>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <Card>
        <CardBody>
          <dl className="space-y-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Nadpis (subject)</dt>
              <dd className="text-gray-900">{campaign.subject}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Titulok</dt>
              <dd className="text-gray-900">{campaign.title || "—"}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Text správy</dt>
              <dd className="whitespace-pre-line text-gray-900">
                {campaign.bodyText || "—"}
              </dd>
            </div>
            {campaign.imageUrl ? (
              <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
                <dt className="font-medium text-gray-500">Fotka</dt>
                <dd>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={campaign.imageUrl}
                    alt=""
                    className="aspect-video w-full max-w-sm rounded-lg object-cover"
                  />
                </dd>
              </div>
            ) : null}
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Vytvorená</dt>
              <dd className="text-gray-900">{formatDate(campaign.createdAt)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Príjemcovia</dt>
              <dd className="text-gray-900">{campaign._count.recipients}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
              <dt className="font-medium text-gray-500">Štatistiky</dt>
              <dd className="text-gray-900">
                Otvorené {campaign.statsOpened} · Kliky {campaign.statsClicked} ·
                Bounce {campaign.statsBounced} · Odhlásenia {campaign.statsUnsub}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
        Testovacie odoslanie, výber skupín a doručiteľnosť (Brevo) pribudnú vo
        fáze 1.
      </p>
    </div>
  );
}
