"use client";

import { Button } from "@factory/ui/components/button";
import { Input } from "@factory/ui/components/input";
import { Label } from "@factory/ui/components/label";
import { useActionState, useEffect, useRef } from "react";
import { addItem } from "@/app/pantry/actions";
import type { FormState } from "@/lib/pantry";

const initialState: FormState = { status: "idle" };

/** Name + optional expiry; built to take under 10 seconds (the brief's riskiest assumption). */
export function AddItemForm() {
  const [state, formAction, pending] = useActionState(addItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="name">Item</Label>
          <Input
            ref={nameRef}
            id="name"
            name="name"
            placeholder="e.g. Greek yogurt"
            autoComplete="off"
            autoFocus
            required
            maxLength={80}
            aria-invalid={state.status === "error"}
            aria-describedby={state.status === "error" ? "add-item-error" : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiresOn">Expires (optional)</Label>
          <Input id="expiresOn" name="expiresOn" type="date" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {state.status === "error" && (
        <p id="add-item-error" role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
