import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import UnsubscribeForm from "@/components/forms/UnsubscribeForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Odhlásenie z odberu – BOVAP",
};

export default async function OdhlaseniePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  const done = sp.done === "1";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardBody className="text-center">
            {!subscriber ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  Neplatný odkaz
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Tento odkaz na odhlásenie neexistuje alebo už bol použitý.
                </p>
              </>
            ) : done ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  Odhlásené ✓
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Adresa{" "}
                  <span className="font-medium text-gray-700">
                    {subscriber.email}
                  </span>{" "}
                  už nebude dostávať naše správy. Ďakujeme.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  Odhlásiť z odberu?
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Naozaj chcete odhlásiť adresu{" "}
                  <span className="font-medium text-gray-700">
                    {subscriber.email}
                  </span>{" "}
                  z odberu správ OZ BOVAP?
                </p>
                <UnsubscribeForm token={token} />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
