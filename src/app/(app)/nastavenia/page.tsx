import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/forms/SettingsForm";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NastaveniaPage() {
  const settings = await prisma.setting.findMany();
  const initial = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Nastavenia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Odosielateľ a pätička – tieto údaje sa zobrazia v každej správe.
        </p>
      </div>

      <Card>
        <CardBody>
          <SettingsForm initial={initial} />
        </CardBody>
      </Card>

      <div className="rounded-lg border border-gray-100 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-medium text-gray-900">
          Doručiteľnosť (fáza 3–4)
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Overenie domény bovap.sk v Brevo, nastavenie SPF / DKIM / DMARC v DNS
          a test doručiteľnosti pribudnú v ďalších fázach.
        </p>
      </div>
    </div>
  );
}
