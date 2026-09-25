import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <p
        role="note"
        className="border-destructive text-destructive rounded-md border px-3 py-2 font-medium"
      >
        DRAFT — needs legal review
      </p>
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="text-muted-foreground">
        Placeholder text. Replace with reviewed terms before launch.
      </p>
      <Link href="/" className="underline">
        Back home
      </Link>
    </main>
  );
}
