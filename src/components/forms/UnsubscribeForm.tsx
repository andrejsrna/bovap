"use client";

import { useActionState } from "react";
import { unsubscribeAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    unsubscribeAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? <ErrorAlert message={state.error} /> : null}
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Odhlasujem…" : "Áno, odhlásiť ma z odberu"}
      </Button>
    </form>
  );
}
