import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CAMPAIGN_STATUS, formatDate } from "@/lib/utils";

export default async function KampanePage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Kampane
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Všetky odoslané a pripravované správy.
          </p>
        </div>
        <ButtonLink href="/kampane/nova">Nová kampaň</ButtonLink>
      </div>

      {campaigns.length === 0 ? (
        <Card className="border border-dashed border-gray-200 bg-transparent shadow-none">
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-400">
              Zatiaľ žiadne kampane – vytvorte prvú správu.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Názov
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Nadpis
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Stav
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Príjemcovia
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Vytvorená
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  <span className="sr-only">Akcie</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {campaigns.map((c) => {
                const status = CAMPAIGN_STATUS[c.status] ?? {
                  label: c.status,
                  tone: "gray" as const,
                };
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <th className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/kampane/${c.id}`} className="hover:text-primary-700">
                        {c.name}
                      </Link>
                    </th>
                    <td className="px-6 py-4">{c.subject}</td>
                    <td className="px-6 py-4">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-6 py-4">{c._count.recipients}</td>
                    <td className="px-6 py-4">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/kampane/${c.id}`}
                        className="font-medium text-primary-700 hover:text-primary-800"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
