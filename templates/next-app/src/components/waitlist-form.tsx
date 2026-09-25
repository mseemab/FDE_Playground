"use client";

import { Button } from "@factory/ui/components/button";
import { Input } from "@factory/ui/components/input";
import { Label } from "@factory/ui/components/label";
import { useActionState, useEffect } from "react";
import { joinWaitlist } from "@/app/actions";
import { track } from "@/lib/track";
import type { WaitlistState } from "@/lib/waitlist";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);

  useEffect(() => {
    if (state.status === "success") track("waitlist_joined");
  }, [state]);

  if (state.status === "success") {
    return <p role="status">You&apos;re on the list. We&apos;ll be in touch.</p>;
  }

  return (
    <form action={formAction} noValidate className="flex w-full max-w-sm flex-col gap-3">
      <Label htmlFor="email">Email</Label>
      <div className="flex gap-2">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "email-error" : undefined}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join waitlist"}
        </Button>
      </div>
      {state.status === "error" && (
        <p id="email-error" role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
