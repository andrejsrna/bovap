import { prisma } from "@/lib/prisma";
import AddSubscriberForm from "@/components/forms/AddSubscriberForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  SUBSCRIBER_SOURCE,
  SUBSCRIBER_STATUS,
  formatDate,
} from "@/lib/utils";

export default async function OdoberateliaPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Odoberatelia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Zoznam príjemcov vašich správ. Hromadný import (CSV / z vašich
          schránok centrum.sk) pribudne vo fáze 2.
        </p>
      </div>

      <Card className="p-4 sm:p-6">
        <AddSubscriberForm />
      </Card>

      {subscribers.length === 0 ? (
        <Card className="border border-dashed border-gray-200 bg-transparent shadow-none">
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-gray-400">
              Zatiaľ žiadni odoberatelia – pridajte prvého.
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
                      {SUBSCRIBER_SOURCE[s.source] ?? s.source}
                    </td>
                    <td className="px-6 py-4">{formatDate(s.createdAt)}</td>
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
