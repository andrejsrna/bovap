import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import {
  CAMPAIGN_STATUS,
  formatDate,
} from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [totalSubs, activeSubs, totalCampaigns, recentCampaigns] =
    await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count(),
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Odoberatelia celkom", value: totalSubs },
    { label: "Aktívni odoberatelia", value: activeSubs },
    { label: "Kampane", value: totalCampaigns },
    {
      label: "Posledná kampaň",
      value:
        recentCampaigns[0]?.status === "SENT"
          ? formatDate(recentCampaigns[0].sentAt)
          : "zatiaľ žiadna",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Prehľad
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vitajte späť{user.name ? `, ${user.name}` : ""} – tu je stav vášho
            emailového rozhrania.
          </p>
        </div>
        <div className="flex gap-3">
          <ButtonLink href="/kampane/nova" variant="soft">
            Nová kampaň
          </ButtonLink>
          <ButtonLink href="/odberatelia">Pridať odberateľa</ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {s.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Posledné kampane
            </h2>
            <Link
              href="/kampane"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Všetky kampane →
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
              Zatiaľ žiadna kampaň. Vytvorte prvú – je to na pár klikov.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {recentCampaigns.map((c) => {
                const status = CAMPAIGN_STATUS[c.status] ?? {
                  label: c.status,
                  tone: "gray" as const,
                };
                return (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/kampane/${c.id}`} className="block truncate font-medium text-gray-900 hover:text-primary-700">
                        {c.name}
                      </Link>
                      <p className="truncate text-sm text-gray-400">
                        {c.subject}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <span className="hidden text-sm text-gray-400 sm:block">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
