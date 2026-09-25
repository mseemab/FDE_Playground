import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Pantry Pal</h1>
        <p className="text-muted-foreground text-lg">
          Log your groceries in seconds and see what&apos;s about to expire, so you cook it instead
          of throwing it out.
        </p>
      </div>
      <WaitlistForm />
      <footer className="text-muted-foreground flex gap-4 text-sm">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
