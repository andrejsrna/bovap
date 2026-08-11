import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddSubscriberForm from "@/components/forms/AddSubscriberForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  SUBSCRIBER_SOURCE,
  SUBSCRIBER_STATUS,
  formatDate,
} from "@/lib/utils";

export default async function OdoberateliaPage({
  searchParams,
}: {
  searchParams: Promise<{ skupina?: string }>;
}) {
  const sp = await searchParams;
  const activeGroup = sp.skupina ?? null;

  const [groups, subscribers, total] = await Promise.all([
    prisma.group.findMany({
      include: { _count: { select: { subscribers: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.subscriber.findMany({
      where: activeGroup
        ? { groups: { some: { group: { name: activeGroup } } } }
        : undefined,
      include: { groups: { include: { group: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.subscriber.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Odoberatelia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Zoznam príjemcov vašich správ ({total} celkom). Hromadný import z
          vašich schránok centrum.sk beží priebežne.
        </p>
      </div>

      {/* Filtre podľa skupiny */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/odberatelia"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            !activeGroup
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          Všetci
        </Link>
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/odberatelia?skupina=${encodeURIComponent(g.name)}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              activeGroup === g.name
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {g.name}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px]",
                activeGroup === g.name
                  ? "bg-primary-100"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {g._count.subscribers}
            </span>
          </Link>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <AddSubscriberForm />
      </Card>

      {subscribers.length === 0 ? (
        <Card className="border border-dashed border-gray-200 bg-transparent shadow-none">
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-400">
              {activeGroup
                ? `V skupine „${activeGroup}" zatiaľ nie sú odoberatelia.`
                : "Zatiaľ žiadni odoberatelia – pridajte prvého."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Email
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Meno
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Stav
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Skupiny
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Zdroj
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                  Pridaný
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {subscribers.map((s) => {
                const status = SUBSCRIBER_STATUS[s.status] ?? {
                  label: s.status,
                  tone: "gray" as const,
                };
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <th className="px-6 py-4 font-medium text-gray-900">
                      {s.email}
                    </th>
                    <td className="px-6 py-4">{s.name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.groups.length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          s.groups.map((g) => (
                            <Link
                              key={g.groupId}
                              href={`/odberatelia?skupina=${encodeURIComponent(
                                g.group.name,
                              )}`}
                              className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700 hover:bg-secondary-200"
                            >
                              {g.group.name}
                            </Link>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {SUBSCRIBER_SOURCE[s.source] ?? s.source}
                    </td>
                    <td className="px-6 py-4">{formatDate(s.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {subscribers.length >= 200 && (
            <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400">
              Zobrazuje sa prvých 200 záznamov – použite filter skupiny alebo
              vyhľadávanie (pribudne v QoL).
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
