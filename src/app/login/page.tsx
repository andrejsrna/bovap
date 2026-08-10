import type { Metadata } from "next";
import LoginForm from "@/components/forms/LoginForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Prihlásenie – BOVAP",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-xl font-bold text-white">
            B
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-gray-900">
            BOVAP – Emailové rozhranie
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Prihláste sa na odosielanie správ a správu odoberateľov.
          </p>
        </div>

        <Card>
          <CardBody>
            <LoginForm />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-gray-400">
          Prístupové údaje vám nastavíme pri odovzdaní riešenia. V development
          prostredí: admin@bovap.sk / bovap-admin-2026
        </p>
      </div>
    </div>
  );
}
