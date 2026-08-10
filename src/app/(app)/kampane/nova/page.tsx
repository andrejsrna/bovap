import NewCampaignForm from "@/components/forms/NewCampaignForm";
import { Card, CardBody } from "@/components/ui/Card";

export default function NovaKampanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Nová kampaň
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Vyplňte obsah správy – náhľad, testovacie odoslanie a odoslanie
          pribudnú vo fáze 1.
        </p>
      </div>

      <Card>
        <CardBody>
          <NewCampaignForm />
        </CardBody>
      </Card>
    </div>
  );
}
